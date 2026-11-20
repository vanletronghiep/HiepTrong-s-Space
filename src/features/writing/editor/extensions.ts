import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import Code from '@tiptap/extension-code';
import Details, { DetailsContent, DetailsSummary } from '@tiptap/extension-details';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from '@tiptap/extension-list';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import { Dropcursor, Placeholder } from '@tiptap/extensions';
import { mergeAttributes, Node, type Extensions } from '@tiptap/core';

/** A soft tinted block for a note or question set apart from the text. */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-callout]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, { 'data-callout': '', class: 'wr-callout' }),
    0,
  ],
});

/** An inline link to another page in the same room. Clicking opens that page. */
export const PageLink = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({
    id: { default: '' },
    title: { default: 'Untitled' },
  }),
  parseHTML: () => [{ tag: 'span[data-page-link]' }],
  renderHTML: ({ node, HTMLAttributes }) => [
    'span',
    mergeAttributes(HTMLAttributes, {
      'data-page-link': node.attrs.id as string,
      class: 'wr-page-link',
    }),
    `↗ ${node.attrs.title as string}`,
  ],
});

export interface WritingExtensionOptions {
  placeholder: string;
}

export function writingExtensions({ placeholder }: WritingExtensionOptions): Extensions {
  return [
    Document,
    Paragraph,
    Text,
    HardBreak,
    History,
    Heading.configure({ levels: [1, 2, 3] }),
    Bold,
    Italic,
    Strike,
    Underline,
    Code,
    Highlight,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noreferrer noopener', target: '_blank' },
    }),
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    TaskItem.configure({ nested: true }),
    Blockquote,
    HorizontalRule,
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    Callout,
    PageLink,
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder }),
    Dropcursor,
  ];
}
