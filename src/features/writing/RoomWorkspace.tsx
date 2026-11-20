'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Plus, Search, Star } from 'lucide-react';
import { usePageReady, useTransitionRouter } from '@/features/transitions/TransitionProvider';
import {
  useCreateWritingPage,
  useDeleteWritingPage,
  useUpdateWritingPage,
  useWritingPages,
} from '@/client/queries/writing';
import type { WritingPage, WritingRoom } from '@/contracts/writing';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import {
  buildPageTree,
  contentToPlainText,
  essaysToRevisit,
  pickDrawerNote,
  type PageTreeNode,
} from '@/domain/writing';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { cn } from '@/ui/cn';
import { ConfirmDialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { Skeleton } from '@/ui/Skeleton';
import { PageEditor, PageIconGlyph } from './PageEditor';
import styles from './writing.module.css';

type DraftFilter = 'all' | 'seed' | 'sprout' | 'ready' | 'clipping';

const RIPENESS_LABEL = { seed: 'Seed', sprout: 'Sprout', ready: 'Ready' } as const;
const STATUS_LABEL = { writing: 'Writing', revising: 'Revising', done: 'Done' } as const;

function excerpt(page: WritingPage, length = 110): string {
  const text = contentToPlainText(page.content).replace(/\s+/g, ' ');
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

function formatDay(iso: string): string {
  return formatScheduledDate(iso, DEFAULT_APP_TIMEZONE);
}

export function RoomWorkspace({ room }: { room: WritingRoom }) {
  const inheritedTheme = useFeatureTheme();
  const router = useTransitionRouter();
  const { data: pages = [], isLoading, isError, refetch } = useWritingPages(room);
  usePageReady(!isLoading);
  const createPage = useCreateWritingPage();
  const updatePage = useUpdateWritingPage();
  const deletePage = useDeleteWritingPage();

  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DraftFilter>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showTrash, setShowTrash] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WritingPage | null>(null);
  const [error, setError] = useState('');
  const now = useMemo(() => new Date(), []);

  const isPerspective = room === 'perspective';
  const roomLabel = isPerspective ? 'My Perspective' : 'Draft Room';

  // Open the page named in ?p= on arrival, and keep the address in step afterwards.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('p');
    if (requested) setSelectedId(requested);
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('p', id);
    else url.searchParams.delete('p');
    window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const live = useMemo(() => pages.filter((page) => !page.trashedAt && !page.archivedAt), [pages]);
  const trashed = useMemo(() => pages.filter((page) => page.trashedAt), [pages]);
  const archived = useMemo(
    () => pages.filter((page) => page.archivedAt && !page.trashedAt),
    [pages],
  );
  const selected = selectedId ? (live.find((page) => page.id === selectedId) ?? null) : null;

  const term = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!term) return null;
    return live.filter(
      (page) =>
        page.title.toLowerCase().includes(term) ||
        page.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        contentToPlainText(page.content).toLowerCase().includes(term),
    );
  }, [live, term]);

  const tree = useMemo(() => buildPageTree(pages), [pages]);
  const favorites = live.filter((page) => page.favorite);
  const drawerNote = !isPerspective ? pickDrawerNote(pages, now) : null;
  const today = formatScheduledDate(now, DEFAULT_APP_TIMEZONE);
  const revisit = isPerspective ? essaysToRevisit(pages, today) : [];

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : fallback);
    }
  };

  const newPage = (parentId: string | null = null) =>
    run(async () => {
      const created = await createPage.mutateAsync({ room, parentId, title: '' });
      select(created.id);
    }, 'Could not create a page right now.');

  const createSubpage = async (parentId: string): Promise<WritingPage | null> => {
    try {
      return await createPage.mutateAsync({ room, parentId, title: 'Untitled' });
    } catch {
      setError('Could not create the sub-page right now.');
      return null;
    }
  };

  const patch = (
    page: WritingPage,
    change: Parameters<typeof updatePage.mutateAsync>[0]['patch'],
  ) =>
    run(() => updatePage.mutateAsync({ id: page.id, patch: change }), 'Could not update the page.');

  const trash = (page: WritingPage) =>
    run(async () => {
      await updatePage.mutateAsync({ id: page.id, patch: { trashed: true } });
      if (selectedId === page.id) select(null);
    }, 'Could not move the page to the trash.');

  const moveRoom = (page: WritingPage, target: WritingRoom) =>
    run(async () => {
      await updatePage.mutateAsync({ id: page.id, patch: { room: target, parentId: null } });
      select(null);
      router.push(`/writing/${target}?p=${page.id}`);
    }, 'Could not move the page.');

  const toggleCollapsed = (id: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (node: PageTreeNode, depth: number) => {
    const open = !collapsed.has(node.page.id);
    return (
      <li key={node.page.id}>
        <div
          className={cn(styles.treeRow, selectedId === node.page.id && styles.treeRowActive)}
          style={{ paddingLeft: `${depth * 14 + 4}px` }}
        >
          {node.children.length > 0 ? (
            <button
              type="button"
              className={styles.treeToggle}
              aria-expanded={open}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${node.page.title || 'Untitled'}`}
              onClick={() => toggleCollapsed(node.page.id)}
            >
              <ChevronRight
                size={14}
                aria-hidden="true"
                className={open ? styles.rotated : undefined}
              />
            </button>
          ) : (
            <span className={styles.treeSpacer} aria-hidden="true" />
          )}
          <button
            type="button"
            className={styles.treeLabel}
            aria-current={selectedId === node.page.id ? 'page' : undefined}
            onClick={() => select(node.page.id)}
          >
            <PageIconGlyph icon={node.page.icon} size={14} />
            <span>{node.page.title || 'Untitled'}</span>
          </button>
          <button
            type="button"
            className={styles.treeAdd}
            aria-label={`Add a sub-page to ${node.page.title || 'Untitled'}`}
            onClick={() => void newPage(node.page.id)}
          >
            <Plus size={13} aria-hidden="true" />
          </button>
        </div>
        {node.children.length > 0 && open ? (
          <ul className={styles.treeList}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  /* ── Overview (no page open) ── */
  const overviewPages = useMemo(() => {
    const base = live.filter((page) => !page.parentId);
    if (isPerspective) return base;
    return base.filter((page) => {
      if (filter === 'all') return true;
      if (filter === 'clipping') return page.kind === 'clipping';
      return page.kind === 'note' && page.ripeness === filter;
    });
  }, [live, filter, isPerspective]);

  const overview = (
    <div className={styles.overview}>
      {revisit.length > 0 ? (
        <div role="status" className={styles.revisitBanner}>
          <b>Time to revisit:</b>{' '}
          {revisit.map((page, index) => (
            <span key={page.id}>
              {index > 0 ? ', ' : ''}
              <button type="button" onClick={() => select(page.id)}>
                {page.title || 'Untitled'}
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {drawerNote ? (
        <section className={styles.drawerCard} aria-labelledby="from-drawer">
          <p id="from-drawer" className={styles.drawerLabel}>
            From the drawer · written {formatDay(drawerNote.updatedAt)}
          </p>
          <h3>{drawerNote.title || 'Untitled'}</h3>
          <p>{excerpt(drawerNote, 160)}</p>
          <div className={styles.drawerActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void patch(drawerNote, { resurfaced: true });
                select(drawerNote.id);
              }}
            >
              Open it
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void patch(drawerNote, { resurfaced: true })}
            >
              Keep for later
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void patch(drawerNote, { archived: true })}
            >
              Archive
            </Button>
          </div>
        </section>
      ) : null}

      {!isPerspective ? (
        <div className={styles.filters} role="group" aria-label="Filter notes">
          {(
            [
              ['all', 'All'],
              ['seed', 'Seeds'],
              ['sprout', 'Sprouts'],
              ['ready', 'Ready'],
              ['clipping', 'Clippings'],
            ] as const
          ).map(([key, label]) => (
            <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
              {label}
            </Chip>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className={styles.cards} aria-label="Loading pages">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      ) : overviewPages.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Image
            src={`/visuals/blogs-hub/${isPerspective ? 'woodland-cabin' : 'woodland-typewriter'}.svg`}
            alt=""
            aria-hidden="true"
            width={180}
            height={150}
            unoptimized
            className={styles.emptyArt}
          />
          <EmptyState
            title={isPerspective ? 'No essays yet.' : 'Nothing here yet.'}
            description={
              isPerspective
                ? 'Start with a question you keep coming back to.'
                : 'Jot the first half-thought. It does not have to be good.'
            }
            action={
              <Button variant="primary" size="sm" onClick={() => void newPage()}>
                New page
              </Button>
            }
          />
        </div>
      ) : isPerspective ? (
        <ol className={styles.contents} aria-label="Contents">
          {overviewPages.map((page) => (
            <li key={page.id}>
              <button type="button" onClick={() => select(page.id)}>
                <span className={styles.contentsQuestion}>
                  {page.question || 'No question yet'}
                </span>
                <span className={styles.contentsTitle}>{page.title || 'Untitled'}</span>
                <span className={styles.chip}>{STATUS_LABEL[page.status]}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.cards}>
          {overviewPages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={styles.card}
              onClick={() => select(page.id)}
            >
              <h3>{page.title || 'Untitled'}</h3>
              <p>{excerpt(page)}</p>
              <span className={styles.cardMeta}>
                <span className={cn(styles.ripe, styles[`ripe_${page.ripeness}`])}>
                  {page.kind === 'clipping' ? 'Clipping' : RIPENESS_LABEL[page.ripeness]}
                </span>
                <span>{formatDay(page.updatedAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const content = (
    <div data-feature-theme={inheritedTheme ? undefined : 'blogs-hub'} className={styles.workspace}>
      <header className={styles.roomHeader}>
        <button type="button" className={styles.backLink} onClick={() => router.push('/writing')}>
          <ArrowLeft size={16} aria-hidden="true" /> Writing Room
        </button>
        <h1 className={styles.roomTitle}>
          {roomLabel}
          <span className={styles.caret} aria-hidden="true" />
        </h1>
        <p className={styles.roomSub}>
          {isPerspective
            ? 'Essays on the questions life keeps asking.'
            : 'Loose notes and half-thoughts. Nothing here has to be good yet.'}
        </p>
      </header>

      {isError ? (
        <div role="alert" className={styles.alert}>
          <span>Could not load your pages right now.</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className={styles.alert}>
          {error}
        </div>
      ) : null}

      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label={`${roomLabel} pages`}>
          <div className={styles.searchBox}>
            <Search size={14} aria-hidden="true" />
            <label htmlFor="writing-search" className="sr-only">
              Search this room
            </label>
            <input
              id="writing-search"
              ref={searchRef}
              type="search"
              placeholder="Search (press /)"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} aria-hidden="true" />}
            onClick={() => void newPage()}
            disabled={createPage.isPending}
          >
            New page
          </Button>

          {matches ? (
            <section>
              <h2 className={styles.sideTitle}>
                {matches.length} {matches.length === 1 ? 'result' : 'results'}
              </h2>
              <ul className={styles.treeList}>
                {matches.map((page) => (
                  <li key={page.id}>
                    <button
                      type="button"
                      className={styles.treeLabel}
                      onClick={() => select(page.id)}
                    >
                      <PageIconGlyph icon={page.icon} size={14} />
                      <span>{page.title || 'Untitled'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <>
              {favorites.length > 0 ? (
                <section>
                  <h2 className={styles.sideTitle}>
                    <Star size={12} aria-hidden="true" /> Favorites
                  </h2>
                  <ul className={styles.treeList}>
                    {favorites.map((page) => (
                      <li key={page.id}>
                        <button
                          type="button"
                          className={styles.treeLabel}
                          onClick={() => select(page.id)}
                        >
                          <PageIconGlyph icon={page.icon} size={14} />
                          <span>{page.title || 'Untitled'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section>
                <h2 className={styles.sideTitle}>Pages</h2>
                <button
                  type="button"
                  className={cn(styles.treeLabel, !selected && styles.treeRowActive)}
                  onClick={() => select(null)}
                >
                  {isPerspective ? 'Contents' : 'All notes'}
                </button>
                <ul className={styles.treeList}>{tree.map((node) => renderNode(node, 0))}</ul>
              </section>
            </>
          )}

          {archived.length > 0 ? (
            <section>
              <button
                type="button"
                className={styles.sideToggle}
                aria-expanded={showArchive}
                onClick={() => setShowArchive((value) => !value)}
              >
                Archive ({archived.length})
              </button>
              {showArchive ? (
                <ul className={styles.treeList}>
                  {archived.map((page) => (
                    <li key={page.id} className={styles.trashRow}>
                      <span>{page.title || 'Untitled'}</span>
                      <button type="button" onClick={() => void patch(page, { archived: false })}>
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section>
            <button
              type="button"
              className={styles.sideToggle}
              aria-expanded={showTrash}
              onClick={() => setShowTrash((value) => !value)}
            >
              Trash ({trashed.length})
            </button>
            {showTrash ? (
              trashed.length === 0 ? (
                <p className={styles.railEmpty}>Pages stay here for 30 days.</p>
              ) : (
                <ul className={styles.treeList}>
                  {trashed.map((page) => (
                    <li key={page.id} className={styles.trashRow}>
                      <span>{page.title || 'Untitled'}</span>
                      <button type="button" onClick={() => void patch(page, { trashed: false })}>
                        Restore
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(page)}>
                        Delete forever
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </section>
        </nav>

        <main className={styles.main}>
          {selected ? (
            <PageEditor
              key={selected.id}
              page={selected}
              roomPages={live}
              onOpenPage={select}
              onCreateSubpage={createSubpage}
              onTrash={trash}
              onMoveRoom={moveRoom}
            />
          ) : (
            overview
          )}
        </main>
      </div>

      <ConfirmDialog
        portal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          void run(async () => {
            await deletePage.mutateAsync(target.id);
            setDeleteTarget(null);
          }, 'Could not delete the page.');
        }}
        title="Delete forever?"
        description={
          deleteTarget
            ? `“${deleteTarget.title || 'Untitled'}” and any pages inside it will be removed for good. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete forever"
        isSubmitting={deletePage.isPending}
      />
    </div>
  );

  if (inheritedTheme) return content;
  return <FeatureThemeProvider name="blogs-hub">{content}</FeatureThemeProvider>;
}
