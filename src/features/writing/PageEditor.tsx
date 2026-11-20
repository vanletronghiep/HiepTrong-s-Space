'use client';

import Image from 'next/image';
import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  BookOpen,
  Cloud,
  Compass,
  Feather,
  Leaf,
  Lamp,
  KeyRound,
  Mountain,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useUpdateWritingPage } from '@/client/queries/writing';
import {
  PAGE_COVERS,
  PAGE_ICONS,
  type PageCover,
  type PageIcon,
  type PatchWritingPageInput,
  type Ripeness,
  type WritingPage,
  type WritingRoom,
} from '@/contracts/writing';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import {
  linkedPageIds,
  pageTrail,
  parseDoc,
  readingMinutes,
  wordCountOfContent,
  type DocNode,
} from '@/domain/writing';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { DatePickerField } from '@/ui/DatePickerField';
import { SelectField } from '@/ui/SelectField';
import { NotionEditor, type PageRef } from './editor/NotionEditor';
import styles from './writing.module.css';
import { saveStateLabel, useAutosave } from './use-autosave';

export const ICON_MAP: Record<PageIcon, LucideIcon> = {
  leaf: Leaf,
  feather: Feather,
  book: BookOpen,
  lamp: Lamp,
  compass: Compass,
  mountain: Mountain,
  cloud: Cloud,
  key: KeyRound,
};

const ICON_LABEL: Record<PageIcon, string> = {
  leaf: 'Leaf',
  feather: 'Feather',
  book: 'Book',
  lamp: 'Lamp',
  compass: 'Compass',
  mountain: 'Mountain',
  cloud: 'Cloud',
  key: 'Key',
};

const COVER_LABEL: Record<PageCover, string> = {
  'woodland-cabin': 'Cabin',
  'cabin-lantern': 'Lantern',
  'falling-maple-pair': 'Maple leaves',
  'woodland-typewriter': 'Typewriter',
};

export function PageIconGlyph({ icon, size = 18 }: { icon: PageIcon; size?: number }) {
  const Glyph = ICON_MAP[icon];
  return <Glyph size={size} strokeWidth={1.6} aria-hidden="true" />;
}

interface Heading {
  level: number;
  text: string;
}

function outlineOf(doc: DocNode): Heading[] {
  const found: Heading[] = [];
  const walk = (node: DocNode) => {
    if (node.type === 'heading') {
      const text = (node.content ?? []).map((child) => child.text ?? '').join('');
      if (text.trim()) found.push({ level: Number(node.attrs?.level ?? 1), text });
    }
    node.content?.forEach(walk);
  };
  walk(doc);
  return found;
}

export interface PageEditorProps {
  page: WritingPage;
  /** Every live page in this room, for @ links, sub-pages and backlinks. */
  roomPages: readonly WritingPage[];
  onOpenPage: (id: string) => void;
  onCreateSubpage: (parentId: string) => Promise<WritingPage | null>;
  onTrash: (page: WritingPage) => void;
  onMoveRoom: (page: WritingPage, room: WritingRoom) => void;
  /** Extra controls shown above the title, such as the Draft Room's "Promote" button. */
  actions?: ReactNode;
}

export function PageEditor({
  page,
  roomPages,
  onOpenPage,
  onCreateSubpage,
  onTrash,
  onMoveRoom,
  actions,
}: PageEditorProps) {
  const update = useUpdateWritingPage();
  const titleId = useId();
  const tagsId = useId();
  const questionId = useId();
  const marginId = useId();
  const editorRef = useRef<Editor | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(page.title);
  const [tagsText, setTagsText] = useState(page.tags.join(', '));
  const [content, setContent] = useState(page.content);
  const [reading, setReading] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [marginDraft, setMarginDraft] = useState('');

  const { queue, flush, state } = useAutosave<PatchWritingPageInput>((patch) =>
    update.mutateAsync({ id: page.id, patch }),
  );

  const isPerspective = page.room === 'perspective';
  const trail = useMemo(() => pageTrail(roomPages, page.id), [roomPages, page.id]);
  const outline = useMemo(() => outlineOf(parseDoc(content)), [content]);
  const words = wordCountOfContent(content);
  const children = roomPages.filter((candidate) => candidate.parentId === page.id);
  const backlinks = roomPages.filter(
    (candidate) => candidate.id !== page.id && linkedPageIds(candidate.content).includes(page.id),
  );
  const linkable: PageRef[] = roomPages
    .filter((candidate) => candidate.id !== page.id)
    .map((candidate) => ({ id: candidate.id, title: candidate.title }));

  const saveMarginNote = () => {
    const text = marginDraft.trim();
    if (!text) return;
    queue({
      marginNotes: [
        ...page.marginNotes,
        { id: `mn-${Date.now().toString(36)}`, text, createdAt: new Date().toISOString() },
      ],
    });
    setMarginDraft('');
    void flush().catch(() => undefined);
  };

  const scrollToHeading = (index: number) => {
    const headings = editorRef.current?.view.dom.querySelectorAll('h1, h2, h3');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    headings?.[index]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // Long titles wrap instead of being cut off.
  useLayoutEffect(() => {
    const field = titleRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [title]);

  const stateText = saveStateLabel(state);

  return (
    <article className={styles.pageArticle} aria-label={page.title || 'Untitled page'}>
      <div className={styles.cover} data-has-cover={page.cover ? 'true' : 'false'}>
        {page.cover ? (
          <Image
            src={`/visuals/blogs-hub/${page.cover}.svg`}
            alt=""
            aria-hidden="true"
            width={140}
            height={120}
            unoptimized
            className={styles.coverArt}
          />
        ) : null}
        <div className={styles.coverPicker}>
          <label htmlFor={`${titleId}-cover`} className="sr-only">
            Cover
          </label>
          <SelectField<string>
            id={`${titleId}-cover`}
            ariaLabel="Cover"
            size="sm"
            value={page.cover ?? 'none'}
            onChange={(next) => {
              queue({ cover: next === 'none' ? null : (next as PageCover) });
              void flush().catch(() => undefined);
            }}
            options={[
              { value: 'none', label: 'No cover' },
              ...PAGE_COVERS.map((cover) => ({ value: cover, label: COVER_LABEL[cover] })),
            ]}
          />
        </div>
      </div>

      <div className={styles.pageBody}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <span>{isPerspective ? 'My Perspective' : 'Draft Room'}</span>
          {trail.map((ancestor) => (
            <span key={ancestor.id}>
              <span aria-hidden="true"> / </span>
              {ancestor.id === page.id ? (
                <span aria-current="page">{ancestor.title || 'Untitled'}</span>
              ) : (
                <button type="button" onClick={() => onOpenPage(ancestor.id)}>
                  {ancestor.title || 'Untitled'}
                </button>
              )}
            </span>
          ))}
        </nav>

        <div className={styles.pageHead}>
          <div className={styles.iconWrap}>
            <button
              type="button"
              className={styles.pageIconBtn}
              aria-label={`Page icon: ${ICON_LABEL[page.icon]}. Change`}
              aria-expanded={iconOpen}
              onClick={() => setIconOpen((open) => !open)}
            >
              <PageIconGlyph icon={page.icon} size={26} />
            </button>
            {iconOpen ? (
              <div className={styles.iconMenu} role="group" aria-label="Choose an icon">
                {PAGE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={ICON_LABEL[icon]}
                    aria-pressed={icon === page.icon}
                    onClick={() => {
                      queue({ icon });
                      void flush().catch(() => undefined);
                      setIconOpen(false);
                    }}
                  >
                    <PageIconGlyph icon={icon} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.headActions}>
            {actions}
            {isPerspective ? (
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={reading}
                onClick={() => setReading((value) => !value)}
              >
                {reading ? 'Edit' : 'Read'}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={page.favorite}
              aria-label={page.favorite ? 'Remove from favorites' : 'Add to favorites'}
              leftIcon={
                <Star size={14} aria-hidden="true" fill={page.favorite ? 'currentColor' : 'none'} />
              }
              onClick={() => {
                queue({ favorite: !page.favorite });
                void flush().catch(() => undefined);
              }}
            >
              Favorite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} aria-hidden="true" />}
              onClick={() => onTrash(page)}
            >
              Move to trash
            </Button>
          </div>
        </div>

        <label htmlFor={titleId} className="sr-only">
          Page title
        </label>
        <textarea
          id={titleId}
          ref={titleRef}
          className={styles.titleInput}
          rows={1}
          value={title}
          maxLength={200}
          placeholder="Untitled"
          readOnly={reading}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
          onChange={(event) => {
            const next = event.target.value.replace(/\n/g, ' ');
            setTitle(next);
            queue({ title: next });
          }}
        />

        {isPerspective ? (
          <div className={styles.fieldRow}>
            <label htmlFor={questionId}>The question this essay answers</label>
            <input
              id={questionId}
              type="text"
              className={styles.plainInput}
              defaultValue={page.question}
              maxLength={300}
              readOnly={reading}
              placeholder="What life question is this about?"
              onChange={(event) => queue({ question: event.target.value })}
            />
          </div>
        ) : null}

        <div className={styles.props}>
          {isPerspective ? (
            <div className={styles.prop}>
              <span>Status</span>
              <SelectField<WritingPage['status']>
                ariaLabel="Status"
                size="sm"
                value={page.status}
                onChange={(status) => {
                  queue({ status });
                  void flush().catch(() => undefined);
                }}
                options={[
                  { value: 'writing', label: 'Writing' },
                  { value: 'revising', label: 'Revising' },
                  { value: 'done', label: 'Done' },
                ]}
              />
            </div>
          ) : (
            <div className={styles.prop}>
              <span>Ripeness</span>
              <SelectField<Ripeness>
                ariaLabel="Ripeness"
                size="sm"
                value={page.ripeness}
                onChange={(ripeness) => {
                  queue({ ripeness });
                  void flush().catch(() => undefined);
                }}
                options={[
                  { value: 'seed', label: 'Seed' },
                  { value: 'sprout', label: 'Sprout' },
                  { value: 'ready', label: 'Ready' },
                ]}
              />
            </div>
          )}
          {isPerspective ? (
            <div className={styles.prop}>
              <span>Revisit on</span>
              <DatePickerField
                mode="iso"
                ariaLabel="Revisit on"
                value={page.revisitOn ?? ''}
                onChange={(next) => {
                  queue({ revisitOn: next || null });
                  void flush().catch(() => undefined);
                }}
              />
            </div>
          ) : null}
          <div className={styles.prop}>
            <label htmlFor={tagsId}>Tags</label>
            <input
              id={tagsId}
              type="text"
              className={styles.plainInput}
              value={tagsText}
              placeholder="Habits, Focus"
              onChange={(event) => setTagsText(event.target.value)}
              onBlur={() => {
                const tags = tagsText
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, 12);
                queue({ tags });
              }}
            />
          </div>
          <div className={styles.prop}>
            <span>Edited</span>
            <b>{formatScheduledDate(page.updatedAt, DEFAULT_APP_TIMEZONE)}</b>
          </div>
        </div>

        <div className={styles.editorGrid}>
          <div className={styles.editorMain}>
            <NotionEditor
              key={`${page.id}-${reading ? 'read' : 'edit'}`}
              initialContent={content}
              ariaLabel={`${page.title || 'Untitled'} content`}
              editable={!reading}
              reading={reading}
              pages={linkable}
              onOpenPage={onOpenPage}
              onCreateSubpage={async () => {
                const created = await onCreateSubpage(page.id);
                return created ? { id: created.id, title: created.title } : null;
              }}
              onEditor={(editor) => {
                editorRef.current = editor;
              }}
              onChange={(json) => {
                setContent(json);
                queue({ content: json });
              }}
            />
            <p className={styles.saveLine} role="status" aria-live="polite">
              {stateText}
            </p>
          </div>

          <aside className={styles.rail} aria-label="Page details">
            <section>
              <h3 className={styles.railTitle}>On this page</h3>
              {outline.length === 0 ? (
                <p className={styles.railEmpty}>Add a heading to build an outline.</p>
              ) : (
                <ol className={styles.outline}>
                  {outline.map((heading, index) => (
                    <li key={`${index}-${heading.text}`} data-level={heading.level}>
                      <button type="button" onClick={() => scrollToHeading(index)}>
                        {heading.text}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <dl className={styles.stats}>
                <div>
                  <dt>Words</dt>
                  <dd className="tabular-nums">{words.toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt>Reading time</dt>
                  <dd className="tabular-nums">{readingMinutes(words)} min</dd>
                </div>
              </dl>
            </section>

            {children.length > 0 ? (
              <section>
                <h3 className={styles.railTitle}>Sub-pages</h3>
                <ul className={styles.railList}>
                  {children.map((child) => (
                    <li key={child.id}>
                      <button type="button" onClick={() => onOpenPage(child.id)}>
                        <PageIconGlyph icon={child.icon} size={14} /> {child.title || 'Untitled'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {backlinks.length > 0 ? (
              <section>
                <h3 className={styles.railTitle}>Linked from</h3>
                <ul className={styles.railList}>
                  {backlinks.map((link) => (
                    <li key={link.id}>
                      <button type="button" onClick={() => onOpenPage(link.id)}>
                        {link.title || 'Untitled'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {isPerspective ? (
              <section>
                <h3 className={styles.railTitle}>Margin notes</h3>
                {page.marginNotes.length === 0 ? (
                  <p className={styles.railEmpty}>
                    Come back later and add a dated note without changing the essay.
                  </p>
                ) : (
                  <ul className={styles.marginList}>
                    {page.marginNotes.map((note) => (
                      <li key={note.id}>
                        <b>{formatScheduledDate(note.createdAt, DEFAULT_APP_TIMEZONE)}</b>
                        <span>{note.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <label htmlFor={marginId} className="sr-only">
                  New margin note
                </label>
                <textarea
                  id={marginId}
                  className={cn(styles.plainInput, styles.marginInput)}
                  value={marginDraft}
                  rows={2}
                  maxLength={1000}
                  placeholder="What would you say now?"
                  onChange={(event) => setMarginDraft(event.target.value)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!marginDraft.trim()}
                  onClick={saveMarginNote}
                >
                  Add margin note
                </Button>
              </section>
            ) : null}

            <section>
              <h3 className={styles.railTitle}>Move</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveRoom(page, isPerspective ? 'drafts' : 'perspective')}
              >
                {isPerspective ? 'Move back to Draft Room' : 'Promote to My Perspective'}
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </article>
  );
}
