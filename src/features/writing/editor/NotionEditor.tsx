'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react';
import { parseDoc } from '@/domain/writing';
import { cn } from '@/ui/cn';
import { writingExtensions } from './extensions';
import styles from './notion-editor.module.css';

export interface PageRef {
  id: string;
  title: string;
}

export interface NotionEditorProps {
  /** Document as a JSON string. Read once; remount with a new `key` to load another page. */
  initialContent: string;
  ariaLabel: string;
  placeholder?: string;
  editable?: boolean;
  /** Larger serif text for reading an essay. */
  reading?: boolean;
  /** Pages that can be linked with @. */
  pages?: readonly PageRef[];
  onChange?: (json: string) => void;
  onOpenPage?: (id: string) => void;
  /** Creates a sub-page and returns it so a link can be inserted. */
  onCreateSubpage?: () => Promise<PageRef | null>;
  onEditor?: (editor: Editor | null) => void;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  glyph: string;
  run: (editor: Editor) => void | Promise<void>;
}

interface Trigger {
  kind: '/' | '@';
  query: string;
  from: number;
  to: number;
  left: number;
  top: number;
}

const BLOCK_ITEMS: MenuItem[] = [
  {
    id: 'text',
    label: 'Text',
    hint: 'Plain paragraph',
    keywords: 'paragraph plain text',
    glyph: 'T',
    run: (e) => void e.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    label: 'Heading 1',
    hint: 'Big section title',
    keywords: 'h1 title heading large',
    glyph: 'H1',
    run: (e) => void e.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    hint: 'Medium section title',
    keywords: 'h2 heading medium',
    glyph: 'H2',
    run: (e) => void e.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    hint: 'Small section title',
    keywords: 'h3 heading small',
    glyph: 'H3',
    run: (e) => void e.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet',
    label: 'Bulleted list',
    hint: 'A simple list',
    keywords: 'bullet list ul unordered',
    glyph: '•',
    run: (e) => void e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered',
    label: 'Numbered list',
    hint: 'A list in order',
    keywords: 'numbered ordered list ol',
    glyph: '1.',
    run: (e) => void e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'todo',
    label: 'To-do',
    hint: 'Track a small step',
    keywords: 'todo task checkbox check',
    glyph: '☐',
    run: (e) => void e.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'toggle',
    label: 'Toggle',
    hint: 'Hide details inside',
    keywords: 'toggle details collapse fold',
    glyph: '▸',
    run: (e) => void e.chain().focus().setDetails().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    hint: 'A line someone said',
    keywords: 'quote blockquote citation',
    glyph: '“',
    run: (e) => void e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'callout',
    label: 'Callout',
    hint: 'Set off a note or question',
    keywords: 'callout note info aside',
    glyph: '!',
    run: (e) => void e.chain().focus().toggleWrap('callout').run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    hint: 'A thin line between sections',
    keywords: 'divider rule line hr separator',
    glyph: '—',
    run: (e) => void e.chain().focus().setHorizontalRule().run(),
  },
];

const MENU_ID_PREFIX = 'wr-menu-';

function readTrigger(editor: Editor): Trigger | null {
  const { selection } = editor.state;
  if (!selection.empty) return null;
  const { $from } = selection;
  if (!$from.parent.isTextblock) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
  const match = /(?:^|\s)([/@])([^\s/@]{0,30})$/.exec(before);
  if (!match) return null;
  const kind = match[1] as '/' | '@';
  const query = match[2] ?? '';
  const to = $from.pos;
  const from = to - query.length - 1;
  const coords = editor.view.coordsAtPos(to);
  return { kind, query, from, to, left: coords.left, top: coords.bottom + 6 };
}

export function NotionEditor({
  initialContent,
  ariaLabel,
  placeholder = "Write, or press '/' for blocks",
  editable = true,
  reading = false,
  pages = [],
  onChange,
  onOpenPage,
  onCreateSubpage,
  onEditor,
  className,
}: NotionEditorProps) {
  const listboxId = useId();
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [active, setActive] = useState(0);
  const [selectionBar, setSelectionBar] = useState<{ left: number; top: number } | null>(null);
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const [imageDraft, setImageDraft] = useState<string | null>(null);
  const [, forceFormatRefresh] = useState(0);

  const refreshRef = useRef<(() => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const onOpenPageRef = useRef(onOpenPage);
  const onCreateSubpageRef = useRef(onCreateSubpage);
  const pagesRef = useRef(pages);
  useEffect(() => {
    onChangeRef.current = onChange;
    onOpenPageRef.current = onOpenPage;
    onCreateSubpageRef.current = onCreateSubpage;
    pagesRef.current = pages;
  });

  const items = useMemo<MenuItem[]>(() => {
    if (!trigger) return [];
    const query = trigger.query.toLowerCase();
    if (trigger.kind === '@') {
      return pages
        .filter((page) => !query || page.title.toLowerCase().includes(query))
        .slice(0, 8)
        .map<MenuItem>((page) => ({
          id: `page-${page.id}`,
          label: page.title || 'Untitled',
          hint: 'Link to this page',
          keywords: '',
          glyph: '↗',
          run: (e) =>
            void e
              .chain()
              .focus()
              .insertContent([
                { type: 'pageLink', attrs: { id: page.id, title: page.title || 'Untitled' } },
                { type: 'text', text: ' ' },
              ])
              .run(),
        }));
    }
    const all: MenuItem[] = [...BLOCK_ITEMS];
    if (onCreateSubpage) {
      all.push({
        id: 'subpage',
        label: 'Sub-page',
        hint: 'A page inside this one',
        keywords: 'page subpage child new',
        glyph: '↳',
        run: async (e) => {
          const created = await onCreateSubpageRef.current?.();
          if (created) {
            e.chain()
              .focus()
              .insertContent([
                { type: 'pageLink', attrs: { id: created.id, title: created.title || 'Untitled' } },
                { type: 'text', text: ' ' },
              ])
              .run();
          }
        },
      });
    }
    all.push({
      id: 'image',
      label: 'Image',
      hint: 'From a web address',
      keywords: 'image picture photo url',
      glyph: '▣',
      run: () => setImageDraft(''),
    });
    return all.filter(
      (item) => !query || item.label.toLowerCase().includes(query) || item.keywords.includes(query),
    );
  }, [trigger, pages, onCreateSubpage]);

  const menuState = useRef({ open: false, items, active: 0, trigger });
  menuState.current = { open: trigger !== null && items.length > 0, items, active, trigger };

  const runItem = useCallback((editor: Editor, item: MenuItem, current: Trigger) => {
    editor.chain().focus().deleteRange({ from: current.from, to: current.to }).run();
    setTrigger(null);
    void item.run(editor);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: writingExtensions({ placeholder }),
    content: parseDoc(initialContent) as JSONContent,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel,
        class: cn(styles.prose, reading && styles.reading),
      },
      handleKeyDown: (view, event) => {
        const state = menuState.current;
        if (!state.open || !state.trigger) return false;
        if (event.key === 'ArrowDown') {
          setActive((index) => (index + 1) % state.items.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          setActive((index) => (index - 1 + state.items.length) % state.items.length);
          return true;
        }
        if (event.key === 'Escape') {
          setTrigger(null);
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          const item = state.items[state.active];
          const current = state.trigger;
          const live = (view as unknown as { dom: { editor?: Editor } }).dom.editor;
          if (item && live) {
            runItem(live, item, current);
            return true;
          }
        }
        return false;
      },
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target as HTMLElement | null;
          const link = target?.closest<HTMLElement>('[data-page-link]');
          if (link) {
            event.preventDefault();
            onOpenPageRef.current?.(link.getAttribute('data-page-link') ?? '');
            return true;
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor: live, transaction }) => {
      if (transaction.docChanged) onChangeRef.current?.(JSON.stringify(live.getJSON()));
    },
  });

  // Give the key handler a way back to the live editor.
  useEffect(() => {
    if (!editor) return undefined;
    (editor.view.dom as unknown as { editor?: Editor }).editor = editor;
    onEditor?.(editor);
    return () => onEditor?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Track the caret for the slash/@ menu and the selection for the format bar.
  useEffect(() => {
    if (!editor) return undefined;
    const refresh = () => {
      if (!editor.isEditable) {
        setTrigger(null);
        setSelectionBar(null);
        return;
      }
      const next = readTrigger(editor);
      setTrigger((previous) => {
        if (!next) return null;
        if (previous && previous.kind === next.kind && previous.from === next.from) {
          return previous.query === next.query ? previous : next;
        }
        setActive(0);
        return next;
      });
      const { from, to, empty } = editor.state.selection;
      if (empty || !editor.view.hasFocus()) {
        setSelectionBar(null);
        setLinkDraft(null);
      } else {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        setSelectionBar({
          left: Math.min(start.left, end.left),
          top: Math.min(start.top, end.top) - 44,
        });
      }
      forceFormatRefresh((n) => n + 1);
    };
    refreshRef.current = refresh;
    const afterUpdate = () => {
      refresh();
      // The editor may scroll the caret into view just after the update.
      requestAnimationFrame(refresh);
    };
    editor.on('selectionUpdate', afterUpdate);
    editor.on('update', afterUpdate);
    editor.on('blur', () => setSelectionBar(null));
    return () => {
      editor.off('selectionUpdate', afterUpdate);
      editor.off('update', afterUpdate);
    };
  }, [editor]);

  // Floating pieces use viewport coordinates, so follow the caret while the page scrolls.
  const floating = trigger !== null || selectionBar !== null;
  useEffect(() => {
    if (!floating) return undefined;
    const reposition = () => refreshRef.current?.();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [floating]);

  const mark = (name: string) => editor?.isActive(name) ?? false;

  const applyLink = () => {
    if (!editor || linkDraft === null) return;
    const href = linkDraft.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
      editor.chain().focus().setLink({ href }).run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({ href: `https://${href}` })
        .run();
    }
    setLinkDraft(null);
  };

  const applyImage = () => {
    if (!editor || imageDraft === null) return;
    const src = imageDraft.trim();
    if (/^https?:\/\//i.test(src)) editor.chain().focus().setImage({ src }).run();
    setImageDraft(null);
  };

  return (
    <div className={cn(styles.shell, className)}>
      {editor && editable ? (
        <div className={styles.fixedToolbar} role="toolbar" aria-label="Formatting">
          <button
            type="button"
            aria-pressed={mark('bold')}
            aria-label="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>
          <button
            type="button"
            aria-pressed={mark('italic')}
            aria-label="Italic"
            className={styles.italicBtn}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            i
          </button>
          <button
            type="button"
            aria-pressed={mark('underline')}
            aria-label="Underline"
            className={styles.underlineBtn}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            U
          </button>
          <button
            type="button"
            aria-pressed={mark('strike')}
            aria-label="Strikethrough"
            className={styles.strikeBtn}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            S
          </button>
          <button
            type="button"
            aria-pressed={mark('code')}
            aria-label="Inline code"
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            {'</>'}
          </button>
          <button
            type="button"
            aria-pressed={mark('highlight')}
            aria-label="Highlight"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            Hl
          </button>
          <span className={styles.toolbarHint}>Type / for blocks, @ to link a page</span>
        </div>
      ) : null}

      <EditorContent editor={editor} />

      {imageDraft !== null ? (
        <form
          className={styles.inlineForm}
          onSubmit={(event) => {
            event.preventDefault();
            applyImage();
          }}
        >
          <label htmlFor={`${listboxId}-image`}>Image address</label>
          <input
            id={`${listboxId}-image`}
            type="url"
            value={imageDraft}
            onChange={(event) => setImageDraft(event.target.value)}
            placeholder="https://…"

            autoFocus
          />
          <button type="submit">Insert</button>
          <button type="button" onClick={() => setImageDraft(null)}>
            Cancel
          </button>
        </form>
      ) : null}

      {editor && editable && selectionBar ? (
        <div
          className={styles.bubble}
          style={{ left: selectionBar.left, top: Math.max(8, selectionBar.top) }}
          role="toolbar"
          aria-label="Format selection"
          onMouseDown={(event) => {
            if ((event.target as HTMLElement).tagName !== 'INPUT') event.preventDefault();
          }}
        >
          {linkDraft === null ? (
            <>
              <button
                type="button"
                aria-pressed={mark('bold')}
                aria-label="Bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                B
              </button>
              <button
                type="button"
                aria-pressed={mark('italic')}
                aria-label="Italic"
                className={styles.italicBtn}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                i
              </button>
              <button
                type="button"
                aria-pressed={mark('strike')}
                aria-label="Strikethrough"
                className={styles.strikeBtn}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                S
              </button>
              <button
                type="button"
                aria-pressed={mark('highlight')}
                aria-label="Highlight"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              >
                Hl
              </button>
              <button
                type="button"
                aria-pressed={mark('link')}
                aria-label="Link"
                onClick={() => setLinkDraft((editor.getAttributes('link').href as string) ?? '')}
              >
                Link
              </button>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyLink();
              }}
            >
              <label className="sr-only" htmlFor={`${listboxId}-link`}>
                Link address
              </label>
              <input
                id={`${listboxId}-link`}
                type="text"
                value={linkDraft}
                onChange={(event) => setLinkDraft(event.target.value)}
                placeholder="Paste a link"

                autoFocus
              />
              <button type="submit">Apply</button>
            </form>
          )}
        </div>
      ) : null}

      {editor && trigger && items.length > 0 ? (
        <div
          id={listboxId}
          className={styles.menu}
          style={{ left: Math.max(8, trigger.left), top: trigger.top }}
          role="listbox"
          aria-label={trigger.kind === '/' ? 'Insert a block' : 'Link to a page'}
          onMouseDown={(event) => event.preventDefault()}
        >
          <span className={styles.menuLabel}>
            {trigger.kind === '/' ? 'Basic blocks' : 'Pages in this room'}
          </span>
          {items.map((item, index) => (
            <button
              key={item.id}
              id={`${MENU_ID_PREFIX}${item.id}`}
              type="button"
              role="option"
              aria-selected={index === active}
              className={cn(styles.menuItem, index === active && styles.menuItemActive)}
              onMouseEnter={() => setActive(index)}
              onClick={() => runItem(editor, item, trigger)}
            >
              <span className={styles.menuGlyph} aria-hidden="true">
                {item.glyph}
              </span>
              <span>
                {item.label}
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {editor && trigger && trigger.kind === '@' && items.length === 0 ? (
        <div
          className={styles.menu}
          style={{ left: Math.max(8, trigger.left), top: trigger.top }}
          role="status"
        >
          <span className={styles.menuLabel}>No page matches “{trigger.query}”</span>
        </div>
      ) : null}
    </div>
  );
}
