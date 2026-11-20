/**
 * Small Markdown subset for checkpoint descriptions: headings (# ## ###), "- " bullets,
 * **bold**, *italic* and `inline code`. Everything else, including raw HTML, stays literal text.
 * Pure and framework-free.
 */

export interface InlineToken {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
}

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; inline: InlineToken[] }
  | { type: 'bullets'; items: InlineToken[][] }
  | { type: 'paragraph'; lines: InlineToken[][] };

const isSpace = (ch: string | undefined) => ch !== undefined && /\s/.test(ch);

/** Index of the closing `marker` for an opener ending at `from`, or -1. */
function findClose(line: string, marker: string, from: number): number {
  let search = from;
  while (search < line.length) {
    const idx = line.indexOf(marker, search);
    if (idx === -1) return -1;
    const before = line[idx - 1];
    const after = line[idx + marker.length];
    const touchesMoreStars = marker === '*' && (before === '*' || after === '*');
    if (idx > from && !isSpace(before) && !touchesMoreStars) return idx;
    search = idx + (touchesMoreStars ? 1 + (after === '*' ? 1 : 0) : marker.length);
  }
  return -1;
}

export function parseInline(line: string, bold = false, italic = false): InlineToken[] {
  const tokens: InlineToken[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer) tokens.push({ text: buffer, bold, italic, code: false });
    buffer = '';
  };

  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '`') {
      const end = line.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        tokens.push({ text: line.slice(i + 1, end), bold, italic, code: true });
        i = end + 1;
        continue;
      }
    } else if (ch === '*') {
      const marker = line.startsWith('***', i) ? '***' : line.startsWith('**', i) ? '**' : '*';
      const opensAt = i + marker.length;
      if (opensAt < line.length && !isSpace(line[opensAt])) {
        const close = findClose(line, marker, opensAt);
        if (close !== -1) {
          flush();
          const inner = line.slice(opensAt, close);
          tokens.push(...parseInline(inner, bold || marker !== '*', italic || marker !== '**'));
          i = close + marker.length;
          continue;
        }
      }
    }
    buffer += ch;
    i += 1;
  }
  flush();
  return tokens;
}

const HEADING = /^(#{1,3})\s+(.+)$/;
const BULLET = /^\s*-\s+(.*)$/;

export function parseCheckpointMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: InlineToken[][] | null = null;
  let bullets: InlineToken[][] | null = null;
  const close = () => {
    if (paragraph) blocks.push({ type: 'paragraph', lines: paragraph });
    if (bullets) blocks.push({ type: 'bullets', items: bullets });
    paragraph = null;
    bullets = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      close();
      continue;
    }
    const heading = HEADING.exec(line.trim());
    if (heading) {
      close();
      blocks.push({
        type: 'heading',
        level: heading[1]!.length as 1 | 2 | 3,
        inline: parseInline(heading[2]!.trim()),
      });
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      if (paragraph) {
        blocks.push({ type: 'paragraph', lines: paragraph });
        paragraph = null;
      }
      (bullets ??= []).push(parseInline(bullet[1]!.trim()));
      continue;
    }
    if (bullets) {
      blocks.push({ type: 'bullets', items: bullets });
      bullets = null;
    }
    (paragraph ??= []).push(parseInline(line.trim()));
  }
  close();
  return blocks;
}

export interface TextEdit {
  value: string;
  start: number;
  end: number;
}

const countTrailing = (text: string, ch: string) => {
  let n = 0;
  while (n < text.length && text[text.length - 1 - n] === ch) n += 1;
  return n;
};
const countLeading = (text: string, ch: string) => {
  let n = 0;
  while (n < text.length && text[n] === ch) n += 1;
  return n;
};

/** True when the marker is the outermost layer of star runs on both sides of the text. */
function wrappedBy(before: string, after: string, marker: '**' | '*'): boolean {
  const left = countTrailing(before, '*');
  const right = countLeading(after, '*');
  return marker === '**' ? left >= 2 && right >= 2 : left % 2 === 1 && right % 2 === 1;
}

/**
 * Ctrl/Cmd+B and Ctrl/Cmd+I. With a selection it wraps or unwraps the text. With only a caret
 * it opens a marker pair to type inside, steps out of an open pair, or removes an empty one.
 */
export function toggleMarkdownWrap(
  value: string,
  start: number,
  end: number,
  marker: '**' | '*',
): TextEdit {
  const m = marker.length;
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);

  if (start !== end) {
    if (wrappedBy(before, after, marker)) {
      return {
        value: before.slice(0, -m) + selected + after.slice(m),
        start: start - m,
        end: end - m,
      };
    }
    return {
      value: `${before}${marker}${selected}${marker}${after}`,
      start: start + m,
      end: end + m,
    };
  }

  // Caret between an empty pair: remove it.
  if (before.endsWith(marker) && after.startsWith(marker) && wrappedBy(before, after, marker)) {
    return { value: before.slice(0, -m) + after.slice(m), start: start - m, end: start - m };
  }
  // Caret just before a closing marker: step out of the pair.
  const stars = countLeading(after, '*');
  const closesPair = marker === '*' ? stars % 2 === 1 : stars >= 2;
  if (closesPair && before.includes(marker)) {
    return { value, start: start + m, end: start + m };
  }
  return { value: `${before}${marker}${marker}${after}`, start: start + m, end: start + m };
}
