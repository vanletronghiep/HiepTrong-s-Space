import { describe, expect, it } from 'vitest';
import {
  extractNotePlainText,
  noteMarkdownToProseMirrorJson,
  parseNoteDocument,
  proseMirrorJsonToNoteMarkdown,
  serializeNoteDocument,
} from '@/domain/note-format';

describe('note-format restricted Markdown codec', () => {
  it('round-trips paragraphs, hard breaks, bold spans, and bullet lists losslessly', () => {
    const sample = [
      'Prepare **system review**',
      'Check **deadline** precision',
      '',
      '- Verify **bold item** serialization',
      '- Confirm Tiếng Việt có dấu & ASCII mix',
    ].join('\n');

    const pmJson = noteMarkdownToProseMirrorJson(sample);
    const roundTripped = proseMirrorJsonToNoteMarkdown(pmJson);

    expect(roundTripped).toBe(sample);
    expect(serializeNoteDocument(parseNoteDocument(sample))).toBe(sample);
  });

  it('treats unsupported Markdown and raw HTML tags as literal plain text', () => {
    const raw = [
      '# Not a heading',
      '> Not a blockquote with *single asterisks*',
      'Visit [example](https://example.com) and `<code />`',
      '<script>alert("xss")</script> <b>keep tags literal</b>',
    ].join('\n');

    const roundTripped = proseMirrorJsonToNoteMarkdown(noteMarkdownToProseMirrorJson(raw));
    expect(roundTripped).toBe(raw);

    const parsed = parseNoteDocument(raw);
    expect(parsed.blocks).toHaveLength(1);
    expect(parsed.blocks[0]?.type).toBe('paragraph');

    const plain = extractNotePlainText(raw);
    expect(plain).toContain('<script>alert("xss")</script>');
    expect(plain).toContain('# Not a heading');
  });

  it('handles unmatched asterisks and empty bold tokens predictably', () => {
    const raw = 'Ratio 2 ** 3 and empty **** token next to **real bold**.';
    const roundTripped = proseMirrorJsonToNoteMarkdown(noteMarkdownToProseMirrorJson(raw));
    expect(roundTripped).toBe(raw);

    const plain = extractNotePlainText(raw);
    expect(plain).toBe('Ratio 2 ** 3 and empty **** token next to real bold.');
  });

  it('extracts clean plain text without bold markers or leading bullet hyphens', () => {
    const note = [
      'Summary with **key focus** item.',
      '',
      '- First **urgent** step',
      '- Second step',
    ].join('\n');

    const plain = extractNotePlainText(note);
    expect(plain).not.toContain('**');
    expect(plain).toContain('Summary with key focus item.');
    expect(plain).toContain('First urgent step');
    expect(plain).toContain('Second step');
  });

  it('handles empty and whitespace-only notes safely', () => {
    expect(parseNoteDocument('').blocks).toEqual([]);
    expect(parseNoteDocument('   \n  ').blocks).toEqual([]);
    expect(proseMirrorJsonToNoteMarkdown(noteMarkdownToProseMirrorJson(''))).toBe('');
    expect(extractNotePlainText('')).toBe('');
  });
});
