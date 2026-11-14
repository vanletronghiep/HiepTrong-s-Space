'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { CheckCheck, Search, X } from 'lucide-react';
import Image from 'next/image';
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useSetNotificationRead,
} from '@/client/queries/notifications';
import { useMinuteTicker } from '@/client/use-minute-ticker';
import type { NotificationKind } from '@/contracts';
import {
  countNotificationGroups,
  filterNotifications,
  groupNotificationsByDate,
  NOTIFICATION_KIND_ORDER,
  type NotificationKindFilter,
  type NotificationReadFilter,
} from '@/domain/notification-filter';
import { NOTIFICATION_TAG_LABELS } from '@/domain/notification-rules';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/Skeleton';
import { useToast } from '@/ui/Toast';
import { NotificationItem } from './NotificationItem';
import styles from './notifications-hub.module.css';

const READ_FILTER_OPTIONS: readonly { value: NotificationReadFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export function NotificationsHubView() {
  const searchInputId = useId();
  const markAllScopeId = useId();
  const { data, isLoading, isError, refetch } = useNotifications();
  const setReadMutation = useSetNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const now = useMinuteTicker();
  const { pushToast } = useToast();

  const [query, setQuery] = useState('');
  const [readStatus, setReadStatus] = useState<NotificationReadFilter>('all');
  const [kindFilter, setKindFilter] = useState<NotificationKindFilter>('all');
  const deferredQuery = useDeferredValue(query);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const counts = useMemo(() => countNotificationGroups(items), [items]);
  const filteredItems = useMemo(
    () =>
      filterNotifications(items, {
        query: deferredQuery,
        readStatus,
        kind: kindFilter,
      }),
    [items, deferredQuery, readStatus, kindFilter],
  );
  const dateGroups = useMemo(
    () => groupNotificationsByDate(filteredItems, now),
    [filteredItems, now],
  );

  const hasActiveFilters = query.trim().length > 0 || readStatus !== 'all' || kindFilter !== 'all';

  const handleToggleRead = (notificationId: string, nextIsRead: boolean) => {
    setReadMutation.mutate(
      { id: notificationId, isRead: nextIsRead },
      {
        onError: () => {
          pushToast('Could not update notification status.', 'error');
        },
      },
    );
  };

  const handleMarkAllRead = () => {
    if (counts.unread === 0 || markAllReadMutation.isPending) {
      return;
    }
    markAllReadMutation.mutate(undefined, {
      onError: () => {
        pushToast('Could not mark notifications as read.', 'error');
      },
    });
  };

  const handleNavigate = (item: { id: string; isRead: boolean }) => {
    if (!item.isRead) {
      setReadMutation.mutate({ id: item.id, isRead: true });
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setReadStatus('all');
    setKindFilter('all');
  };

  const statusAnnouncement = (() => {
    if (isLoading) return 'Loading notifications.';
    if (isError) return 'Inbox summary unavailable.';
    if (items.length === 0) return 'No notifications in your inbox.';
    if (!hasActiveFilters) {
      return `Showing all ${items.length} ${items.length === 1 ? 'notification' : 'notifications'}.`;
    }
    return `Showing ${filteredItems.length} of ${items.length} notifications.`;
  })();

  return (
    <div className={styles.pageStack}>
      <Image
        src="/visuals/notification/blossom-vine-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        className={styles.vineEdgeDecor}
        unoptimized
      />

      <header className={styles.masthead}>
        <Image
          src="/visuals/notification/sakura-petal-current.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          className={styles.petalBackdrop}
          unoptimized
        />

        <div className={styles.mastheadText}>
          <p className={styles.eyebrow}>Daily correspondence · 7-day archive</p>
          <h1 className={styles.displayTitle}>
            Sakura <span className={styles.displayTitleEmphasis}>Inbox</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            Calm reminders for due-soon deadlines, overdue tasks, scheduled events, and completed
            milestones.
          </p>
        </div>

        <div className={styles.mastheadActions}>
          <Button
            variant="primary"
            pill
            leftIcon={<CheckCheck size={16} strokeWidth={1.5} aria-hidden="true" />}
            disabled={counts.unread === 0 || markAllReadMutation.isPending}
            aria-describedby={markAllScopeId}
            onClick={handleMarkAllRead}
          >
            Mark full inbox read
          </Button>
          <p id={markAllScopeId} className={styles.markAllScopeNote}>
            Affects full inbox, not only filtered results.
          </p>
        </div>
      </header>

      <div className={styles.inboxLayout}>
        <aside className={styles.folioAside} aria-label="Notification summary">
          <Image
            src="/visuals/notification/sakura-branch.svg"
            alt=""
            aria-hidden="true"
            width={240}
            height={240}
            className={styles.folioBranchCorner}
            unoptimized
          />

          <div className={styles.folioHeroStat}>
            <span className={styles.folioHeroCount}>{counts.unread}</span>
            <span className={styles.folioHeroLabel}>unread awaiting attention</span>
          </div>

          <div className={styles.folioStatGrid}>
            <div className={styles.folioStatRow}>
              <span>Due soon</span>
              <span className="tabular-nums font-medium">{counts.byKind.due_soon}</span>
            </div>
            <div className={styles.folioStatRow}>
              <span>Overdue</span>
              <span className="tabular-nums font-medium">{counts.byKind.overdue}</span>
            </div>
            <div className={styles.folioStatRow}>
              <span>Total saved</span>
              <span className="tabular-nums font-medium">{counts.total}</span>
            </div>
          </div>

          <p className={styles.folioColophon}>
            Selecting any linked notification opens its task, event, or project directly and marks
            it read.
          </p>
        </aside>

        <section className={styles.feedColumn} aria-label="Notification filters and stream">
          <div className={styles.filterShelf}>
            <div className={styles.searchAndStatusRow}>
              <div className={styles.searchFieldWrap}>
                <label htmlFor={searchInputId} className="sr-only">
                  Search notifications
                </label>
                <Search size={16} strokeWidth={1.5} aria-hidden="true" className={styles.searchIcon} />
                <input
                  id={searchInputId}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search notifications…"
                  className={styles.searchInput}
                />
                {query.length > 0 ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className={styles.clearSearchBtn}
                  >
                    <X size={15} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <div role="group" aria-label="Filter by read status" className={styles.segmentedGroup}>
                {READ_FILTER_OPTIONS.map((opt) => {
                  const active = readStatus === opt.value;
                  const optCount =
                    opt.value === 'all'
                      ? counts.total
                      : opt.value === 'unread'
                        ? counts.unread
                        : counts.read;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setReadStatus(opt.value)}
                      className={cn(styles.segmentedBtn, active && styles.segmentedBtnActive)}
                    >
                      <span>{opt.label}</span>
                      <span className="tabular-nums">{optCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div role="group" aria-label="Filter by notification type" className={styles.kindFilterRow}>
              <button
                type="button"
                aria-pressed={kindFilter === 'all'}
                onClick={() => setKindFilter('all')}
                className={cn(styles.kindChip, kindFilter === 'all' && styles.kindChipActive)}
              >
                <span>All types</span>
                <span className="tabular-nums text-ws-text-muted">{counts.total}</span>
              </button>

              {NOTIFICATION_KIND_ORDER.map((kind: NotificationKind) => {
                const active = kindFilter === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setKindFilter(kind)}
                    className={cn(styles.kindChip, active && styles.kindChipActive)}
                  >
                    <span>{NOTIFICATION_TAG_LABELS[kind]}</span>
                    <span className="tabular-nums text-ws-text-muted">{counts.byKind[kind]}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.statusBar}>
              <p role="status" aria-atomic="true" className={styles.statusText}>
                {statusAnnouncement}
              </p>
              {hasActiveFilters ? (
                <button type="button" onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <div className={styles.notificationList} aria-label="Loading notifications">
              <Skeleton className="h-[112px] w-full rounded-item" />
              <Skeleton className="h-[112px] w-full rounded-item" />
              <Skeleton className="h-[112px] w-full rounded-item" />
            </div>
          ) : isError ? (
            <div className={styles.calmStateCard}>
              <p className={styles.errorText}>Could not load notifications.</p>
              <Button variant="secondary" pill onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.calmStateCard}>
              <Image
                src="/visuals/notification/fairy-glass-chime.svg"
                alt=""
                aria-hidden="true"
                width={320}
                height={280}
                className={styles.chimeImage}
                unoptimized
              />
              <h2 className={styles.calmTitle}>All caught up.</h2>
              <p className={styles.calmBody}>
                Your universe is running smoothly. Upcoming deadlines and reminders will gather
                softly here.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.calmStateCard}>
              <Image
                src="/visuals/notification/fairy-glass-chime.svg"
                alt=""
                aria-hidden="true"
                width={320}
                height={280}
                className={styles.chimeImage}
                unoptimized
              />
              <h2 className={styles.calmTitle}>No matching notifications</h2>
              <p className={styles.calmBody}>
                Try adjusting your search phrase, read status, or notification type filter.
              </p>
              <Button variant="secondary" pill onClick={handleResetFilters}>
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              {dateGroups.map((group, index) => {
                const headingId = `notif-date-group-${group.dateKey}`;
                return (
                  <div key={group.dateKey} className="contents">
                    <section className={styles.streamSection} aria-labelledby={headingId}>
                      <div className={styles.sectionHeadingRow}>
                        <h2 id={headingId} className={styles.sectionHeading}>
                          {group.label}
                        </h2>
                        <span className={styles.sectionCount}>{group.items.length}</span>
                      </div>
                      <div className={styles.notificationList}>
                        {group.items.map((item) => (
                          <NotificationItem
                            key={item.id}
                            item={item}
                            now={now}
                            density="comfortable"
                            onToggleRead={handleToggleRead}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </section>

                    {index === 0 && dateGroups.length > 1 ? (
                      <div className={styles.threadDivider} aria-hidden="true">
                        <Image
                          src="/visuals/notification/blossom-thread.svg"
                          alt=""
                          width={720}
                          height={100}
                          className={styles.threadImage}
                          unoptimized
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {dateGroups.length === 1 ? (
                <div className={styles.footerShoreline} aria-hidden="true">
                  <Image
                    src="/visuals/notification/blossom-thread.svg"
                    alt=""
                    width={720}
                    height={100}
                    className={styles.threadImage}
                    unoptimized
                  />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

