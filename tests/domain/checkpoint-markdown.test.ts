import { describe, expect, it } from 'vitest';
import {
  parseCheckpointMarkdown,
  parseInline,
  toggleMarkdownWrap,
} from '@/domain/checkpoint-markdown';

const flat = (line: string) =>
  parseInline(line).map((t) =>
    [t.text, t.bold ? 'b' : '', t.italic ? 'i' : '', t.code ? 'c' : ''].join('|'),
  );

describe('inline markdown', () => {
  it('reads bold, italic, code and combinations', () => {
    expect(flat('a **b** c')).toEqual(['a |||', 'b|b||', ' c|||']);
    expect(flat('a *b* c')).toEqual(['a |||', 'b||i|', ' c|||']);
    expect(flat('use `npm run check` now')).toEqual(['use |||', 'npm run check|||c', ' now|||']);
    expect(flat('***both***')).toEqual(['both|b|i|']);
    expect(flat('**bold with *italic* inside**')).toEqual([
      'bold with |b||',
      'italic|b|i|',
      ' inside|b||',
    ]);
  });

  it('keeps stray markers and unsupported syntax literal', () => {
    expect(flat('2 * 3 = 6')).toEqual(['2 * 3 = 6|||']);
    expect(flat('**unclosed')).toEqual(['**unclosed|||']);
    expect(flat('<b>raw</b>')).toEqual(['<b>raw</b>|||']);
    expect(flat('`open')).toEqual(['`open|||']);
  });

  it('does not format inside inline code', () => {
    expect(flat('`**not bold**`')).toEqual(['**not bold**|||c']);
  });
});

describe('block markdown', () => {
  it('reads headings, bullets and paragraphs', () => {
    const blocks = parseCheckpointMarkdown(
      '# Title\n## Sub\n### Third\n#### Four\n\nplain **line**\nnext line\n\n- one\n- two *x*\ntail',
    );
    expect(blocks.map((b) => b.type)).toEqual([
      'heading',
      'heading',
      'heading',
      'paragraph', // four hashes are not a heading
      'paragraph',
      'bullets',
      'paragraph',
    ]);
    expect(
      blocks.filter((b) => b.type === 'heading').map((b) => (b as { level: number }).level),
    ).toEqual([1, 2, 3]);
    const list = blocks[5];
    expect(list?.type === 'bullets' && list.items).toHaveLength(2);
    const para = blocks[4];
    expect(para?.type === 'paragraph' && para.lines).toHaveLength(2);
  });

  it('returns nothing for empty text', () => {
    expect(parseCheckpointMarkdown('  \n ')).toEqual([]);
  });
});

describe('Ctrl/Cmd+B and Ctrl/Cmd+I', () => {
  it('wraps a selection and unwraps it again', () => {
    const wrapped = toggleMarkdownWrap('make this bold', 5, 9, '**');
    expect(wrapped).toEqual({ value: 'make **this** bold', start: 7, end: 11 });
    const back = toggleMarkdownWrap(wrapped.value, wrapped.start, wrapped.end, '**');
    expect(back).toEqual({ value: 'make this bold', start: 5, end: 9 });
  });

  it('wraps in italics without disturbing bold', () => {
    const bold = toggleMarkdownWrap('a word b', 2, 6, '**');
    const both = toggleMarkdownWrap(bold.value, bold.start, bold.end, '*');
    expect(both.value).toBe('a ***word*** b');
    const noItalic = toggleMarkdownWrap(both.value, both.start, both.end, '*');
    expect(noItalic.value).toBe('a **word** b');
  });

  it('opens a pair at the caret, steps out of it, and removes an empty pair', () => {
    const open = toggleMarkdownWrap('ab', 1, 1, '**');
    expect(open).toEqual({ value: 'a****b', start: 3, end: 3 });
    const removed = toggleMarkdownWrap(open.value, open.start, open.end, '**');
    expect(removed).toEqual({ value: 'ab', start: 1, end: 1 });

    const typed = 'a**hi**b';
    const out = toggleMarkdownWrap(typed, 5, 5, '**');
    expect(out).toEqual({ value: typed, start: 7, end: 7 });
  });

  it('works for italic at the caret', () => {
    const open = toggleMarkdownWrap('', 0, 0, '*');
    expect(open).toEqual({ value: '**', start: 1, end: 1 });
    expect(toggleMarkdownWrap('*x*', 2, 2, '*')).toEqual({ value: '*x*', start: 3, end: 3 });
  });
});
