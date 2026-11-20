import type { WritingPage } from '@/contracts/writing';

/* Pure helpers for the Writing Room. No framework, no I/O. */

export interface DocNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

export const EMPTY_DOC: DocNode = { type: 'doc', content: [{ type: 'paragraph' }] };

export function parseDoc(content: string): DocNode {
  if (!content.trim()) return EMPTY_DOC;
  try {
    const parsed = JSON.parse(content) as DocNode;
    return parsed && parsed.type === 'doc' ? parsed : EMPTY_DOC;
  } catch {
    return plainTextToDoc(content);
  }
}

/** Visible text of a document, blocks separated by a newline. */
export function docToPlainText(doc: DocNode): string {
  const parts: string[] = [];
  const walk = (node: DocNode) => {
    if (node.text) parts.push(node.text);
    node.content?.forEach(walk);
    if (
      node.type &&
      ['paragraph', 'heading', 'listItem', 'taskItem', 'blockquote', 'detailsSummary'].includes(
        node.type,
      )
    ) {
      parts.push('\n');
    }
  };
  walk(doc);
  return parts
    .join('')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function contentToPlainText(content: string): string {
  return content.trim() ? docToPlainText(parseDoc(content)) : '';
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function wordCountOfContent(content: string): number {
  return countWords(contentToPlainText(content));
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

function inlineNodes(text: string): DocNode[] {
  const nodes: DocNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push({ type: 'text', text: text.slice(last, index) });
    const token = match[0];
    const bold = token.startsWith('**');
    nodes.push({
      type: 'text',
      text: token.slice(bold ? 2 : 1, bold ? -2 : -1),
      marks: [{ type: bold ? 'bold' : 'italic' }],
    });
    last = index + token.length;
  }
  if (last < text.length) nodes.push({ type: 'text', text: text.slice(last) });
  return nodes.filter((node) => node.text !== '');
}

function paragraph(text: string): DocNode {
  const content = inlineNodes(text);
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
}

/**
 * Convert the plain text the old Blogs Hub stored (blank-line paragraphs, "- " bullets,
 * "1. " numbered items, **bold** and *italic*) into an editor document.
 */
export function plainTextToDoc(text: string): DocNode {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const content: DocNode[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim() !== '');
    if (lines.length === 0) continue;
    const heading = lines.length === 1 ? /^(#{1,3})\s+(.+)$/.exec(lines[0] ?? '') : null;
    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1]?.length ?? 1 },
        content: [{ type: 'text', text: heading[2] ?? '' }],
      });
    } else if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      content.push({
        type: 'bulletList',
        content: lines.map((line) => ({
          type: 'listItem',
          content: [paragraph(line.replace(/^\s*[-*]\s+/, ''))],
        })),
      });
    } else if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
      content.push({
        type: 'orderedList',
        content: lines.map((line) => ({
          type: 'listItem',
          content: [paragraph(line.replace(/^\s*\d+[.)]\s+/, ''))],
        })),
      });
    } else {
      content.push(paragraph(lines.join(' ')));
    }
  }
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

/* ── Page tree ───────────────────────────────────────────────────────────── */

export interface PageTreeNode {
  page: WritingPage;
  children: PageTreeNode[];
}

/** Live (not trashed, not archived) pages as a tree, newest first at each level. */
export function buildPageTree(pages: readonly WritingPage[]): PageTreeNode[] {
  const live = pages.filter((page) => !page.trashedAt && !page.archivedAt);
  const byParent = new Map<string | null, WritingPage[]>();
  for (const page of live) {
    const parent = page.parentId && live.some((p) => p.id === page.parentId) ? page.parentId : null;
    byParent.set(parent, [...(byParent.get(parent) ?? []), page]);
  }
  const build = (parentId: string | null): PageTreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .map((page) => ({ page, children: build(page.id) }));
  return build(null);
}

/** Ancestors of a page, root first, for breadcrumbs. Guards against cycles. */
export function pageTrail(pages: readonly WritingPage[], pageId: string): WritingPage[] {
  const trail: WritingPage[] = [];
  const seen = new Set<string>();
  let current = pages.find((page) => page.id === pageId);
  while (current && !seen.has(current.id)) {
    trail.unshift(current);
    seen.add(current.id);
    current = current.parentId ? pages.find((page) => page.id === current?.parentId) : undefined;
  }
  return trail;
}

/** True when moving `pageId` under `newParentId` would make a loop. */
export function wouldCreateCycle(
  pages: readonly WritingPage[],
  pageId: string,
  newParentId: string | null,
): boolean {
  if (newParentId === null) return false;
  if (newParentId === pageId) return true;
  return pageTrail(pages, newParentId).some((page) => page.id === pageId);
}

/** Ids of the page and every page below it. */
export function descendantIds(pages: readonly WritingPage[], pageId: string): string[] {
  const ids = [pageId];
  for (let i = 0; i < ids.length; i += 1) {
    for (const page of pages) {
      if (page.parentId === ids[i] && !ids.includes(page.id)) ids.push(page.id);
    }
  }
  return ids;
}

/** Page ids linked from a document with @mentions or page links. */
export function linkedPageIds(content: string): string[] {
  const ids = new Set<string>();
  const walk = (node: DocNode) => {
    if (node.type === 'pageLink' && typeof node.attrs?.id === 'string') ids.add(node.attrs.id);
    node.content?.forEach(walk);
  };
  if (content.trim()) walk(parseDoc(content));
  return [...ids];
}

/* ── Draft Room ─────────────────────────────────────────────────────────── */

const DRAWER_AFTER_DAYS = 30;
const DAY_MS = 86_400_000;

/**
 * "From the drawer": one old, untouched note that has not resurfaced recently.
 * Deterministic for a given day so the same note stays on top all day.
 */
export function pickDrawerNote(pages: readonly WritingPage[], now: Date): WritingPage | null {
  const candidates = pages.filter(
    (page) =>
      page.room === 'drafts' &&
      !page.trashedAt &&
      !page.archivedAt &&
      page.kind === 'note' &&
      page.wordCount > 0 &&
      now.getTime() - Date.parse(page.updatedAt) >= DRAWER_AFTER_DAYS * DAY_MS &&
      (!page.resurfacedAt ||
        now.getTime() - Date.parse(page.resurfacedAt) >= DRAWER_AFTER_DAYS * DAY_MS),
  );
  if (candidates.length === 0) return null;
  const day = Math.floor(now.getTime() / DAY_MS);
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[day % sorted.length] ?? null;
}

/** Essays whose revisit date has arrived. */
export function essaysToRevisit(pages: readonly WritingPage[], today: string): WritingPage[] {
  return pages.filter(
    (page) =>
      page.room === 'perspective' &&
      !page.trashedAt &&
      page.revisitOn !== null &&
      page.revisitOn <= today,
  );
}

/** True when any live page with text was last written on `today`. */
export function wroteOn(
  pages: readonly WritingPage[],
  dayKey: (iso: string) => string,
  today: string,
): boolean {
  return pages.some(
    (page) => !page.trashedAt && dayKey(page.updatedAt) === today && page.wordCount > 0,
  );
}

/* ── Private Room templates ─────────────────────────────────────────────── */

type TemplateType = 'diary' | 'reflection' | 'weekly' | 'monthly';

const TEMPLATE_PROMPTS: Record<TemplateType, string[]> = {
  diary: ['What went well', 'What weighed on me', 'One thing for tomorrow'],
  reflection: ['What happened', 'What I felt', 'What I would do differently'],
  weekly: ['Highlights', 'What was hard', 'What I want next week to hold'],
  monthly: ['What this month was about', 'What I am proud of', 'What I am letting go of'],
};

function heading(text: string): DocNode {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] };
}

/** An entry document with gentle prompts as headings. Every prompt can be skipped or deleted. */
export function entryTemplate(type: TemplateType, recap: DocNode[] = []): string {
  const content: DocNode[] = [...recap];
  for (const prompt of TEMPLATE_PROMPTS[type]) {
    content.push(heading(prompt), { type: 'paragraph' });
  }
  return JSON.stringify({ type: 'doc', content });
}

export interface RecapInput {
  completedTasks: readonly string[];
  focusMinutes: number;
  sessionCount: number;
  rangeLabel: string;
}

/** Facts from the period, pre-filled so only the feelings are left to write. */
export function recapBlocks({
  completedTasks,
  focusMinutes,
  sessionCount,
  rangeLabel,
}: RecapInput): DocNode[] {
  const hours = Math.floor(focusMinutes / 60);
  const minutes = Math.round(focusMinutes % 60);
  const focusText =
    sessionCount === 0
      ? 'No study sessions logged.'
      : `${sessionCount} study ${sessionCount === 1 ? 'session' : 'sessions'}, ${hours ? `${hours} h ` : ''}${minutes} m of focus.`;
  const blocks: DocNode[] = [
    heading(`From my tasks and focus · ${rangeLabel}`),
    { type: 'paragraph', content: [{ type: 'text', text: focusText }] },
  ];
  if (completedTasks.length > 0) {
    blocks.push({
      type: 'bulletList',
      content: completedTasks.slice(0, 15).map((title) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: title }] }],
      })),
    });
  } else {
    blocks.push({ type: 'paragraph', content: [{ type: 'text', text: 'No tasks completed.' }] });
  }
  return blocks;
}

/** Entries written on the same month and day in earlier years. */
export function onThisDay<T extends { date: string; trashedAt: string | null }>(
  entries: readonly T[],
  today: string,
): T[] {
  const monthDay = today.slice(5);
  const year = today.slice(0, 4);
  return entries.filter(
    (entry) =>
      !entry.trashedAt && entry.date.slice(5) === monthDay && entry.date.slice(0, 4) < year,
  );
}
