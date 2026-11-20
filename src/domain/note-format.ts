export interface NoteTextSegment {
  type: 'text';
  text: string;
  bold: boolean;
}

export interface NoteParagraphBlock {
  type: 'paragraph';
  lines: NoteTextSegment[][];
}

export interface NoteBulletListBlock {
  type: 'bulletList';
  items: NoteTextSegment[][][];
}

export type NoteBlock = NoteParagraphBlock | NoteBulletListBlock;

export interface NoteDocument {
  blocks: NoteBlock[];
}

export interface ProseMirrorMarkJson {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorNodeJson {
  type: string;
  text?: string;
  marks?: ProseMirrorMarkJson[];
  content?: ProseMirrorNodeJson[];
  attrs?: Record<string, unknown>;
}

const BULLET_LINE_PATTERN = /^[ \t]*-\s+(.*)$/;

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function mergeSegments(segments: NoteTextSegment[]): NoteTextSegment[] {
  const merged: NoteTextSegment[] = [];
  for (const segment of segments) {
    if (!segment.text) {
      continue;
    }
    const previous = merged.at(-1);
    if (previous && previous.bold === segment.bold) {
      previous.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

function isSpaceChar(ch: string | undefined): boolean {
  return ch !== undefined && /\s/.test(ch);
}

/**
 * Parses inline segments on a single line, supporting `**bold**` spans while
 * keeping unsupported Markdown and raw HTML tags as literal plain text.
 */
export function parseInlineNoteSegments(line: string): NoteTextSegment[] {
  if (!line) {
    return [];
  }

  const segments: NoteTextSegment[] = [];
  let cursor = 0;

  while (cursor < line.length) {
    const openIdx = line.indexOf('**', cursor);
    if (openIdx === -1) {
      segments.push({ type: 'text', text: line.slice(cursor), bold: false });
      break;
    }

    if (openIdx > cursor) {
      segments.push({ type: 'text', text: line.slice(cursor, openIdx), bold: false });
    }

    // Opening delimiter must be left-flanking (not followed immediately by whitespace)
    // and empty `****` tokens stay literal text.
    if (line.startsWith('****', openIdx)) {
      segments.push({ type: 'text', text: '****', bold: false });
      cursor = openIdx + 4;
      continue;
    }

    if (openIdx + 2 >= line.length || isSpaceChar(line[openIdx + 2])) {
      segments.push({ type: 'text', text: '**', bold: false });
      cursor = openIdx + 2;
      continue;
    }

    let searchFrom = openIdx + 2;
    let closeIdx = -1;
    while (searchFrom < line.length) {
      const candidate = line.indexOf('**', searchFrom);
      if (candidate === -1) {
        break;
      }
      if (candidate === openIdx + 2) {
        searchFrom = candidate + 2;
        continue;
      }
      if (!isSpaceChar(line[candidate - 1])) {
        closeIdx = candidate;
        break;
      }
      searchFrom = candidate + 2;
    }

    if (closeIdx === -1) {
      segments.push({ type: 'text', text: '**', bold: false });
      cursor = openIdx + 2;
      continue;
    }

    const inner = line.slice(openIdx + 2, closeIdx);
    segments.push({ type: 'text', text: inner, bold: true });
    cursor = closeIdx + 2;
  }

  return mergeSegments(segments);
}

/**
 * Parses restricted Markdown (`**bold**` and `- ` unordered bullet lists) into a structured AST.
 * All other Markdown syntax and raw HTML remain literal text.
 */
export function parseNoteDocument(markdown: string): NoteDocument {
  if (!markdown) {
    return { blocks: [] };
  }

  const normalized = normalizeLineEndings(markdown);
  if (normalized.trim().length === 0) {
    return { blocks: [] };
  }

  const lines = normalized.split('\n');
  const blocks: NoteBlock[] = [];
  let currentParagraphLines: NoteTextSegment[][] | null = null;
  let currentListItems: NoteTextSegment[][][] | null = null;

  const flushParagraph = () => {
    if (currentParagraphLines && currentParagraphLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: currentParagraphLines });
    }
    currentParagraphLines = null;
  };

  const flushList = () => {
    if (currentListItems && currentListItems.length > 0) {
      blocks.push({ type: 'bulletList', items: currentListItems });
    }
    currentListItems = null;
  };

  for (const rawLine of lines) {
    if (rawLine.trim().length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const bulletMatch = BULLET_LINE_PATTERN.exec(rawLine);
    if (bulletMatch) {
      flushParagraph();
      if (!currentListItems) {
        currentListItems = [];
      }
      currentListItems.push([parseInlineNoteSegments(bulletMatch[1] ?? '')]);
      continue;
    }

    flushList();
    if (!currentParagraphLines) {
      currentParagraphLines = [];
    }
    currentParagraphLines.push(parseInlineNoteSegments(rawLine));
  }

  flushParagraph();
  flushList();

  return { blocks };
}

function serializeLineSegments(segments: NoteTextSegment[]): string {
  return mergeSegments(segments)
    .map((segment) => {
      if (!segment.bold) {
        return segment.text;
      }
      const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(segment.text);
      if (!match || !match[2]) {
        return segment.text;
      }
      return `${match[1]}**${match[2]}**${match[3]}`;
    })
    .join('');
}

/**
 * Serializes a structured `NoteDocument` back to restricted Markdown.
 */
export function serializeNoteDocument(document: NoteDocument): string {
  const renderedBlocks: string[] = [];

  for (const block of document.blocks) {
    if (block.type === 'paragraph') {
      const text = block.lines.map(serializeLineSegments).join('\n');
      renderedBlocks.push(text);
    } else {
      const items = block.items.map((itemLines) => {
        const lineText = itemLines.map(serializeLineSegments).join('\n');
        return `- ${lineText}`;
      });
      if (items.length > 0) {
        renderedBlocks.push(items.join('\n'));
      }
    }
  }

  const joined = renderedBlocks.join('\n\n');
  return joined.trim().length === 0 ? '' : joined;
}

function segmentsToProseMirrorContent(lines: NoteTextSegment[][]): ProseMirrorNodeJson[] {
  const content: ProseMirrorNodeJson[] = [];

  lines.forEach((lineSegments, lineIndex) => {
    if (lineIndex > 0) {
      content.push({ type: 'hardBreak' });
    }
    for (const segment of mergeSegments(lineSegments)) {
      if (!segment.text) {
        continue;
      }
      content.push({
        type: 'text',
        text: segment.text,
        ...(segment.bold ? { marks: [{ type: 'bold' }] } : {}),
      });
    }
  });

  return content;
}

/**
 * Converts restricted Markdown directly to ProseMirror JSON for lossless, XSS-safe Tiptap loading.
 */
export function noteMarkdownToProseMirrorJson(markdown: string): ProseMirrorNodeJson {
  const document = parseNoteDocument(markdown);
  if (document.blocks.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  const content: ProseMirrorNodeJson[] = document.blocks.map((block) => {
    if (block.type === 'paragraph') {
      const inlineContent = segmentsToProseMirrorContent(block.lines);
      return inlineContent.length > 0
        ? { type: 'paragraph', content: inlineContent }
        : { type: 'paragraph' };
    }

    return {
      type: 'bulletList',
      content: block.items.map((itemLines) => {
        const inlineContent = segmentsToProseMirrorContent(itemLines);
        return {
          type: 'listItem',
          content: [
            inlineContent.length > 0
              ? { type: 'paragraph', content: inlineContent }
              : { type: 'paragraph' },
          ],
        };
      }),
    };
  });

  return { type: 'doc', content };
}

function proseMirrorInlineNodesToLines(
  nodes: ProseMirrorNodeJson[] | undefined,
): NoteTextSegment[][] {
  if (!nodes || nodes.length === 0) {
    return [[]];
  }

  const lines: NoteTextSegment[][] = [[]];
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      lines.push([]);
      continue;
    }
    if (node.type === 'text' && typeof node.text === 'string') {
      const isBold = Boolean(node.marks?.some((mark) => mark.type === 'bold'));
      const currentLine = lines.at(-1);
      if (currentLine) {
        currentLine.push({ type: 'text', text: node.text, bold: isBold });
      }
    }
  }

  return lines.map((line) => mergeSegments(line));
}

/**
 * Converts a Tiptap/ProseMirror document JSON back into restricted Markdown (`**bold**` and `- ` lists).
 */
export function proseMirrorJsonToNoteMarkdown(doc: ProseMirrorNodeJson | null | undefined): string {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return '';
  }

  const blocks: NoteBlock[] = [];

  for (const node of doc.content) {
    if (node.type === 'paragraph') {
      const lines = proseMirrorInlineNodesToLines(node.content);
      const hasContent = lines.some((line) => line.length > 0);
      if (hasContent) {
        blocks.push({ type: 'paragraph', lines });
      }
    } else if (node.type === 'bulletList' && Array.isArray(node.content)) {
      const items: NoteTextSegment[][][] = [];
      for (const itemNode of node.content) {
        if (itemNode.type !== 'listItem') {
          continue;
        }
        const itemLines: NoteTextSegment[][] = [];
        for (const child of itemNode.content ?? []) {
          if (child.type === 'paragraph') {
            itemLines.push(...proseMirrorInlineNodesToLines(child.content));
          }
        }
        if (itemLines.length === 0) {
          itemLines.push([]);
        }
        items.push(itemLines);
      }
      if (items.length > 0) {
        blocks.push({ type: 'bulletList', items });
      }
    }
  }

  return serializeNoteDocument({ blocks });
}

/**
 * Extracts readable plain text for compact task previews and search matching by removing
 * bold markers (`**`) and bullet prefixes (`- `).
 */
export function extractNotePlainText(markdown: string): string {
  if (!markdown) {
    return '';
  }
  const document = parseNoteDocument(markdown);
  if (document.blocks.length === 0) {
    return markdown.trim();
  }

  const blockTexts: string[] = [];

  for (const block of document.blocks) {
    if (block.type === 'paragraph') {
      const lineTexts = block.lines
        .map((segments) =>
          segments
            .map((s) => s.text)
            .join('')
            .trim(),
        )
        .filter((line) => line.length > 0);
      if (lineTexts.length > 0) {
        blockTexts.push(lineTexts.join('\n'));
      }
    } else {
      const itemTexts = block.items
        .map((itemLines) =>
          itemLines
            .map((segments) =>
              segments
                .map((s) => s.text)
                .join('')
                .trim(),
            )
            .filter((line) => line.length > 0)
            .join(' '),
        )
        .filter((line) => line.length > 0);
      if (itemTexts.length > 0) {
        blockTexts.push(itemTexts.join(' · '));
      }
    }
  }

  return blockTexts.join('\n').trim();
}
