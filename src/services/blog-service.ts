import { randomUUID } from 'node:crypto';
import type {
  BlogArticle,
  CreateBlogArticleInput,
  PatchBlogArticleInput,
} from '@/contracts/blog';
import { JsonFileStore } from '@/services/storage/json-store';

const articleStore = new JsonFileStore<BlogArticle>('blogs-articles.json');

export class BlogService {
  async getArticles(category?: string, authorship?: string, tag?: string): Promise<BlogArticle[]> {
    const list = await articleStore.getAll();
    return list
      .filter((a) => {
        const matchesCategory = !category || category === 'all' || a.category === category;
        const matchesAuthorship = !authorship || authorship === 'all' || a.authorship === authorship;
        const matchesTag = !tag || tag === 'all' || a.tags.includes(tag);
        return matchesCategory && matchesAuthorship && matchesTag;
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  async getArticleById(id: string): Promise<BlogArticle | null> {
    const list = await articleStore.getAll();
    return list.find((a) => a.id === id || a.slug === id) ?? null;
  }

  async createArticle(input: CreateBlogArticleInput): Promise<BlogArticle> {
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newArticle: BlogArticle = {
      id: `art-${randomUUID().slice(0, 8)}`,
      slug,
      title: input.title,
      subtitle: input.subtitle ?? '',
      category: input.category ?? 'ideas_and_perspectives',
      authorship: input.authorship ?? 'by_hiep',
      authorName: input.authorName ?? (input.authorship === 'saved_from_others' ? 'External author' : 'Hiep Trong'),
      originalSourceUrl: input.originalSourceUrl ?? null,
      commentary: input.commentary ?? null,
      readingTimeMinutes: input.readingTimeMinutes ?? Math.max(1, Math.round(input.content.split(/\s+/).length / 200)),
      publishedAt: new Date().toISOString(),
      shortVersion: input.shortVersion ?? '',
      content: input.content,
      tags: input.tags ?? [],
      sources: (input.sources ?? []).map((s) => ({
        title: s.title,
        url: s.url ?? '',
        note: s.note,
      })),
      status: input.status ?? 'published',
    };

    await articleStore.save(newArticle);
    return newArticle;
  }

  async updateArticle(id: string, patch: PatchBlogArticleInput): Promise<BlogArticle | null> {
    return articleStore.modify(id, (existing) => {

      const updated: BlogArticle = {
        ...existing,
        ...patch,
        title: patch.title ?? existing.title,
        content: patch.content ?? existing.content,
        tags: patch.tags ?? existing.tags,
        sources: patch.sources
          ? patch.sources.map((s) => ({
              title: s.title,
              url: s.url ?? '',
              note: s.note,
            }))
          : existing.sources,
      };

      return updated;
    });
  }

  async deleteArticle(id: string): Promise<boolean> {
    return articleStore.delete(id);
  }
}

export const blogService = new BlogService();
