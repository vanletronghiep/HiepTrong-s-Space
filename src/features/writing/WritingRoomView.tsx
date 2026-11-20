'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { usePageReady, useTransitionRouter } from '@/features/transitions/TransitionProvider';
import { useAllWritingPages } from '@/client/queries/writing';
import { usePrivateStatus } from '@/client/queries/writing';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { contentToPlainText } from '@/domain/writing';
import { Button } from '@/ui/Button';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { Skeleton } from '@/ui/Skeleton';
import { Bookshelf } from './Bookshelf';
import styles from './writing.module.css';

function relativeDay(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function WritingRoomView() {
  const inheritedTheme = useFeatureTheme();
  const router = useTransitionRouter();
  const { data: pages = [], isLoading, isError, refetch } = useAllWritingPages();
  const { data: vault } = usePrivateStatus();
  usePageReady(!isLoading);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const now = useMemo(() => new Date(), []);

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
  const drafts = live.filter((page) => page.room === 'drafts');
  const essays = live.filter((page) => page.room === 'perspective');
  const today = formatScheduledDate(now, DEFAULT_APP_TIMEZONE);
  const lit = live.some(
    (page) =>
      page.wordCount > 0 && formatScheduledDate(page.updatedAt, DEFAULT_APP_TIMEZONE) === today,
  );
  const words = live.reduce((sum, page) => sum + page.wordCount, 0);
  const latestDraft = drafts[0];
  const revising = essays.filter((page) => page.status === 'revising').length;

  const term = search.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return [];
    return live
      .filter(
        (page) =>
          page.title.toLowerCase().includes(term) ||
          page.tags.some((tag) => tag.toLowerCase().includes(term)) ||
          contentToPlainText(page.content).toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [live, term]);

  const privateTag = !vault
    ? 'Locked'
    : !vault.configured
      ? 'Not set up yet'
      : vault.unlocked
        ? 'Unlocked'
        : 'Locked';

  const content = (
    <div data-feature-theme={inheritedTheme ? undefined : 'blogs-hub'} className={styles.shelfPage}>
      <header className={styles.shelfHeader}>
        <div>
          <p className={styles.eyebrow}>Three rooms, one desk</p>
          <h1 className={styles.shelfTitle}>
            Writing Room
            <span className={styles.caret} aria-hidden="true" />
          </h1>
          <p className={styles.roomSub}>
            Pick a book. Drafts for loose thoughts, essays for slow ones, and a private diary behind
            a lock.
          </p>
        </div>
        <div className={styles.shelfSearch}>
          <Search size={14} aria-hidden="true" />
          <label htmlFor="writing-shelf-search" className="sr-only">
            Search Draft Room and My Perspective
          </label>
          <input
            id="writing-shelf-search"
            ref={searchRef}
            type="search"
            placeholder="Search writing (press /)"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {term ? (
            <div className={styles.searchResults} role="region" aria-label="Search results">
              {results.length === 0 ? (
                <p className={styles.railEmpty}>Nothing matches “{search}”.</p>
              ) : (
                <ul>
                  {results.map((page) => (
                    <li key={page.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`/writing/${page.room}?p=${page.id}`)}
                      >
                        <span>{page.title || 'Untitled'}</span>
                        <small>{page.room === 'drafts' ? 'Draft Room' : 'My Perspective'}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </header>

      {isError ? (
        <div role="alert" className={styles.alert}>
          <span>Could not load your writing right now. The books still open.</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-card" />
      ) : (
        <Bookshelf
          lit={lit}
          summary={`3 rooms · ${live.length} ${live.length === 1 ? 'page' : 'pages'} · ${words.toLocaleString('en-US')} words`}
          tags={{
            drafts: latestDraft
              ? `${drafts.length} ${drafts.length === 1 ? 'note' : 'notes'} · last one ${relativeDay(latestDraft.updatedAt, now)}`
              : 'No notes yet',
            perspective: essays.length
              ? `${essays.length} ${essays.length === 1 ? 'essay' : 'essays'}${revising ? ` · ${revising} being revised` : ''}`
              : 'No essays yet',
            private: privateTag,
          }}
        />
      )}
    </div>
  );

  if (inheritedTheme) return content;
  return <FeatureThemeProvider name="blogs-hub">{content}</FeatureThemeProvider>;
}
