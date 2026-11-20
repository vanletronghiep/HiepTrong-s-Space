import { randomUUID } from 'node:crypto';
import type { BlogArticle } from '@/contracts/blog';
import {
  createWritingPageInputSchema,
  patchWritingPageInputSchema,
  writingPageSchema,
  type CreateWritingPageInput,
  type PatchWritingPageInput,
  type WritingPage,
  type WritingRoom,
} from '@/contracts/writing';
import {
  descendantIds,
  plainTextToDoc,
  wordCountOfContent,
  wouldCreateCycle,
  type DocNode,
} from '@/domain/writing';
import { NotFoundError, ValidationError } from './errors';
import { blogService } from './blog-service';
import { JsonFileStore } from './storage/json-store';

const TRASH_KEEP_DAYS = 30;
const DAY_MS = 86_400_000;

interface MetaRecord {
  id: string;
  doneAt: string;
}

function toStored(raw: WritingPage): WritingPage {
  return writingPageSchema.parse(raw);
}

/** Turn an old Blogs Hub article into an editor document, with commentary and sources kept. */
function articleContent(article: BlogArticle): string {
  const doc = plainTextToDoc(article.content);
  const extra: DocNode[] = [];
  if (article.commentary) {
    extra.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Commentary' }],
    });
    extra.push(...(plainTextToDoc(article.commentary).content ?? []));
  }
  if (article.sources.length > 0) {
    extra.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Sources' }],
    });
    extra.push({
      type: 'bulletList',
      content: article.sources.map((source) => ({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: source.url ? `${source.title}: ${source.url}` : source.title },
            ],
          },
        ],
      })),
    });
  }
  return JSON.stringify({ ...doc, content: [...(doc.content ?? []), ...extra] });
}

export function pageFromArticle(article: BlogArticle): WritingPage {
  const clipping = article.authorship === 'saved_from_others';
  const room: WritingRoom = clipping || article.status === 'draft' ? 'drafts' : 'perspective';
  const content = articleContent(article);
  return toStored({
    id: `blog-${article.id}`,
    room,
    parentId: null,
    title: article.title,
    icon: clipping ? 'book' : 'leaf',
    cover: null,
    content,
    tags: article.tags.slice(0, 12),
    ripeness: 'sprout',
    status: room === 'perspective' ? 'done' : 'writing',
    question: room === 'perspective' ? article.subtitle : '',
    kind: clipping ? 'clipping' : 'note',
    sourceUrl: article.originalSourceUrl,
    favorite: false,
    marginNotes: [],
    revisitOn: null,
    resurfacedAt: null,
    archivedAt: null,
    trashedAt: null,
    wordCount: wordCountOfContent(content),
    importedFromBlogId: article.id,
    createdAt: article.publishedAt,
    updatedAt: article.publishedAt,
  } as WritingPage);
}

export class WritingService {
  private readonly store: JsonFileStore<WritingPage>;
  private readonly meta: JsonFileStore<MetaRecord>;
  private importing: Promise<void> | null = null;

  /** `directory` and `loadArticles` exist so tests never touch real data. */
  constructor(
    directory?: string,
    private readonly loadArticles: () => Promise<BlogArticle[]> = () => blogService.getArticles(),
  ) {
    this.store = new JsonFileStore<WritingPage>('writing-pages.json', [], directory);
    this.meta = new JsonFileStore<MetaRecord>('writing-meta.json', [], directory);
  }

  /** One-time, idempotent move of Blogs Hub articles into the new rooms. */
  private ensureBlogImport(): Promise<void> {
    this.importing ??= (async () => {
      if (await this.meta.getById('blog-import')) return;
      const articles = await this.loadArticles();
      const pages = articles.map(pageFromArticle);
      await this.store.transaction((items) => {
        const known = new Set(items.map((item) => item.id));
        return { items: [...items, ...pages.filter((page) => !known.has(page.id))], result: null };
      });
      await this.meta.save({ id: 'blog-import', doneAt: new Date().toISOString() });
    })().catch((error: unknown) => {
      this.importing = null;
      throw error;
    });
    return this.importing;
  }

  private async purgeExpiredTrash(now: Date): Promise<void> {
    const cutoff = now.getTime() - TRASH_KEEP_DAYS * DAY_MS;
    await this.store.transaction((items) => {
      const keep = items.filter((item) => !item.trashedAt || Date.parse(item.trashedAt) > cutoff);
      return { items: keep.length === items.length ? items : keep, result: null };
    });
  }

  async listPages(room?: WritingRoom): Promise<WritingPage[]> {
    await this.ensureBlogImport();
    await this.purgeExpiredTrash(new Date());
    const items = (await this.store.getAll()).map(toStored);
    return items
      .filter((page) => !room || page.room === room)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  async getPage(id: string): Promise<WritingPage | null> {
    await this.ensureBlogImport();
    const item = await this.store.getById(id);
    return item ? toStored(item) : null;
  }

  async createPage(input: CreateWritingPageInput): Promise<WritingPage> {
    await this.ensureBlogImport();
    const validated = createWritingPageInputSchema.parse(input);
    const now = new Date().toISOString();
    return this.store.transaction((items) => {
      if (validated.parentId) {
        const parent = items.find((item) => item.id === validated.parentId);
        if (!parent || parent.room !== validated.room || parent.trashedAt) {
          throw new ValidationError('The parent page must be in the same room.');
        }
      }
      const content = validated.content ?? '';
      const page = toStored({
        ...validated,
        id: randomUUID(),
        content,
        wordCount: wordCountOfContent(content),
        trashedAt: null,
        archivedAt: null,
        resurfacedAt: null,
        importedFromBlogId: null,
        createdAt: now,
        updatedAt: now,
      } as WritingPage);
      return { items: [page, ...items], result: page };
    });
  }

  async updatePage(id: string, rawPatch: PatchWritingPageInput): Promise<WritingPage> {
    await this.ensureBlogImport();
    const patch = patchWritingPageInputSchema.parse(rawPatch);
    const nowIso = new Date().toISOString();
    return this.store.transaction((items) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) throw new NotFoundError('Page not found');

      const { trashed, archived, resurfaced, ...fields } = patch;
      let next: WritingPage = { ...existing, ...(fields as Partial<WritingPage>) };

      if (fields.parentId !== undefined) {
        const parent = fields.parentId ? items.find((item) => item.id === fields.parentId) : null;
        if (fields.parentId && (!parent || parent.room !== (fields.room ?? existing.room))) {
          throw new ValidationError('The parent page must be in the same room.');
        }
        if (wouldCreateCycle(items, id, fields.parentId)) {
          throw new ValidationError('A page cannot be moved inside itself.');
        }
      }
      if (fields.content !== undefined) next.wordCount = wordCountOfContent(fields.content);
      if (archived !== undefined) next.archivedAt = archived ? nowIso : null;
      if (trashed === true) next.trashedAt = nowIso;
      if (trashed === false) next.trashedAt = null;
      if (resurfaced) next.resurfacedAt = nowIso;

      const family = new Set(descendantIds(items, id));
      const roomChanged = fields.room !== undefined && fields.room !== existing.room;
      if (roomChanged && fields.parentId === undefined) next = { ...next, parentId: null };

      const onlyResurfaced =
        resurfaced === true && Object.keys(fields).length === 0 && trashed === undefined;
      if (!onlyResurfaced) next.updatedAt = nowIso;

      const updated = items.map((item) => {
        if (item.id === id) return toStored(next);
        if (!family.has(item.id)) return item;
        // Descendants follow a trash, restore or room change of their parent page.
        let child = item;
        if (trashed === true && !child.trashedAt) child = { ...child, trashedAt: nowIso };
        if (trashed === false && child.trashedAt === existing.trashedAt)
          child = { ...child, trashedAt: null };
        if (roomChanged) child = { ...child, room: fields.room as WritingRoom };
        return child;
      });

      return { items: updated, result: toStored(next) };
    });
  }

  /** Permanently remove a trashed page and everything below it. */
  async deletePage(id: string): Promise<void> {
    await this.ensureBlogImport();
    await this.store.transaction((items) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) throw new NotFoundError('Page not found');
      if (!existing.trashedAt) throw new ValidationError('Move the page to the trash first.');
      const gone = new Set(descendantIds(items, id));
      return { items: items.filter((item) => !gone.has(item.id)), result: null };
    });
  }
}

export const writingService = new WritingService();
