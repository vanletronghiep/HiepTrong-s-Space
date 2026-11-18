'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  GraduationCap,
  MapPin,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { ClientApiError } from '@/client/api-client';
import {
  listBrowserEventDraftEntries,
  removeBrowserDraftKey,
  type BrowserEventDraftEntry,
} from '@/client/editor-drafts';
import {
  useDeleteEventDraft,
  useEventDrafts,
  usePublishEventDraft,
  useSaveEventDraft,
} from '@/client/queries/event-drafts';
import {
  useDeleteEvent,
  useEventOccurrenceWindow,
  useEvents,
  useMutateOccurrence,
} from '@/client/queries/events';
import type { EventCategory, EventOccurrence, OccurrenceScope } from '@/contracts/event';
import type { EventDraftRecord } from '@/contracts/event-draft';
import {
  formatMonthTitle,
  getMonthGridDays,
  monthKeyFromDateStr,
  shiftMonthKey,
} from '@/domain/event-calendar';
import { formatRelativeEventTime } from '@/domain/event-domain';
import {
  addDays,
  computeOccurrenceStats,
  isOccurrenceExpired,
  localDateOf,
  occurrenceDateSpan,
  pastOccurrences,
  selectHighlights,
  upcomingOccurrences,
  weekStartOf,
} from '@/domain/event-occurrence';
import { extractNotePlainText } from '@/domain/note-format';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { usePageReady } from '@/features/transitions/TransitionProvider';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { Skeleton } from '@/ui/Skeleton';
import { useItemAnchor } from '@/ui/use-item-anchor';
import { KindBadge, StatusBadges } from './EventBadges';
import { EventDetailPane } from './EventDetailPane';
import { EventEditorDialog, type EditorRequest, type EditorSaveResult } from './EventEditorDialog';
import { EventReader } from './EventReader';
import { isEventDraftPublishable } from './event-editor';
import {
  formatDayHeader,
  formatRangeLabel,
  formatShortDay,
  formatTime,
  formatTimestamp,
  pluralize,
} from './events-format';
import { HighlightsSection } from './HighlightsSection';
import { SchoolTimetable } from './SchoolTimetable';
import { WeekCalendarPanel, type WeekCalendarState } from './WeekCalendarPanel';
import styles from './events.module.css';

type AgendaTab = 'upcoming' | 'past' | 'drafts';
type CategoryFilter = 'all' | Exclude<EventCategory, 'school'>;

const FALLBACK_TODAY = '2026-11-13';
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
/** Upcoming and Past load in 12-week batches (v3.1 §6.3, §8.4). */
const BATCH_WEEKS = 12;
const FILTERS: readonly CategoryFilter[] = ['all', 'exam', 'meeting', 'deadline', 'contest'];
const FILTER_LABEL: Record<CategoryFilter, string> = {
  all: 'All',
  exam: 'Exams',
  meeting: 'Meetings',
  deadline: 'Deadlines',
  contest: 'Contests',
};

function matchesFilter(occurrence: EventOccurrence, filter: CategoryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'exam') return occurrence.isExam;
  return occurrence.kind === 'event' && occurrence.category === filter;
}

interface ScopeAction {
  action: 'cancel' | 'delete';
  occurrence: EventOccurrence;
}

/** Events & schedule dashboard (v3.1 §6–7). */
export function EventsView() {
  const eventsQuery = useEvents();
  const records = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const draftsQuery = useEventDrafts();
  const drafts = useMemo(() => draftsQuery.data ?? [], [draftsQuery.data]);
  const deleteMutation = useDeleteEvent();
  const occurrenceMutation = useMutateOccurrence();
  const saveDraftMutation = useSaveEventDraft();
  const deleteDraftMutation = useDeleteEventDraft();
  const publishDraftMutation = usePublishEventDraft();

  /* ─── Clock ─── */
  const [today, setToday] = useState(FALLBACK_TODAY);
  const [nowMs, setNowMs] = useState(() => Date.parse(`${FALLBACK_TODAY}T00:00:00+07:00`));
  const [clockLabel, setClockLabel] = useState('');
  const clockSyncedRef = useRef(false);
  // Occurrence windows wait for the real Saigon date so no placeholder range is fetched.
  const [clockReady, setClockReady] = useState(false);

  /* ─── Dashboard state ─── */
  const [dashboard, setDashboard] = useState<'regular' | 'school'>('regular');
  const [tab, setTab] = useState<AgendaTab>('upcoming');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyFromDateStr(FALLBACK_TODAY));
  const [upcomingWeeks, setUpcomingWeeks] = useState(BATCH_WEEKS);
  const [pastWeeks, setPastWeeks] = useState(BATCH_WEEKS);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<EventOccurrence | null>(null);
  const [readerOccurrence, setReaderOccurrence] = useState<EventOccurrence | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarState, setCalendarState] = useState<WeekCalendarState>({
    weekStart: weekStartOf(FALLBACK_TODAY),
    mode: 'overview',
    day: null,
  });
  const [timetableWeek, setTimetableWeek] = useState(weekStartOf(FALLBACK_TODAY));
  const [editorRequest, setEditorRequest] = useState<EditorRequest | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [scopeAction, setScopeAction] = useState<ScopeAction | null>(null);
  const [scopeChoice, setScopeChoice] = useState<OccurrenceScope>('this-week');
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [browserDrafts, setBrowserDrafts] = useState<BrowserEventDraftEntry[]>([]);
  const [isImportingBrowserDrafts, setIsImportingBrowserDrafts] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const regularScrollRef = useRef(0);
  const anchoredItemRef = useRef<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const current = new Date();
      const zoned = formatScheduledDate(current, DEFAULT_APP_TIMEZONE);
      setToday(zoned);
      setNowMs(current.getTime());
      setClockLabel(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: DEFAULT_APP_TIMEZONE,
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          hourCycle: 'h23',
        }).format(current),
      );
      if (!clockSyncedRef.current) {
        clockSyncedRef.current = true;
        setCalendarMonth(monthKeyFromDateStr(zoned));
        setCalendarState({ weekStart: weekStartOf(zoned), mode: 'overview', day: null });
        setTimetableWeek(weekStartOf(zoned));
        setClockReady(true);
      }
    };
    tick();
    const interval = window.setInterval(tick, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  const refreshBrowserDrafts = useCallback(
    () => setBrowserDrafts(listBrowserEventDraftEntries()),
    [],
  );
  useEffect(() => refreshBrowserDrafts(), [refreshBrowserDrafts]);

  const now = useMemo(() => new Date(nowMs), [nowMs]);

  /* ─── Occurrence windows ─── */
  const upcomingTo = addDays(today, upcomingWeeks * 7);
  const pastFrom = addDays(today, -pastWeeks * 7);
  const currentWeek = weekStartOf(today);
  const upcomingWindow = useEventOccurrenceWindow(today, upcomingTo, { enabled: clockReady });
  const pastWindow = useEventOccurrenceWindow(pastFrom, addDays(today, 1), {
    enabled: clockReady && (tab === 'past' || Boolean(selectedDate)),
  });
  const weekWindow = useEventOccurrenceWindow(currentWeek, addDays(currentWeek, 7), {
    enabled: clockReady,
  });
  const monthDays = useMemo(() => getMonthGridDays(calendarMonth), [calendarMonth]);
  const monthFrom = monthDays[0]?.dateStr ?? today;
  const monthWindow = useEventOccurrenceWindow(monthFrom, addDays(monthFrom, 42), {
    enabled: clockReady,
  });

  // Ready once the primary agenda (or a visible error) is usable — not on shell mount.
  usePageReady(clockReady && !upcomingWindow.isLoading && !eventsQuery.isLoading);
  useItemAnchor(records);

  const recordsById = useMemo(
    () => new Map(records.map((record) => [record.id, record])),
    [records],
  );

  const occurrenceIndex = useMemo(() => {
    const index = new Map<string, EventOccurrence>();
    for (const list of [
      monthWindow.occurrences,
      pastWindow.occurrences,
      weekWindow.occurrences,
      upcomingWindow.occurrences,
    ]) {
      for (const occurrence of list) index.set(occurrence.key, occurrence);
    }
    return index;
  }, [
    monthWindow.occurrences,
    pastWindow.occurrences,
    upcomingWindow.occurrences,
    weekWindow.occurrences,
  ]);

  const selectedOccurrence = selectedKey
    ? (occurrenceIndex.get(selectedKey) ??
      (selectedSnapshot?.key === selectedKey ? selectedSnapshot : null))
    : null;

  const upcomingList = useMemo(
    () => upcomingOccurrences(upcomingWindow.occurrences, now),
    [now, upcomingWindow.occurrences],
  );
  const pastList = useMemo(
    () => pastOccurrences(pastWindow.occurrences, now),
    [now, pastWindow.occurrences],
  );
  const highlights = useMemo(
    () => selectHighlights(upcomingWindow.occurrences, now),
    [now, upcomingWindow.occurrences],
  );
  const stats = useMemo(() => {
    const horizon = computeOccurrenceStats(upcomingWindow.occurrences, now);
    const week = computeOccurrenceStats(weekWindow.occurrences, now);
    return { ...horizon, thisWeekCount: week.thisWeekCount };
  }, [now, upcomingWindow.occurrences, weekWindow.occurrences]);

  const horizonLabel = formatRangeLabel(today, addDays(upcomingTo, -1));
  const pastLabel = formatRangeLabel(pastFrom, today);

  const visibleAgenda = useMemo(() => {
    if (selectedDate) {
      return [...occurrenceIndex.values()]
        .filter((occurrence) => {
          const span = occurrenceDateSpan(occurrence);
          return span.first <= selectedDate && span.last >= selectedDate;
        })
        .filter((occurrence) => matchesFilter(occurrence, filter))
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt) || (a.key < b.key ? -1 : 1));
    }
    const list = tab === 'past' ? pastList : upcomingList;
    return list.filter((occurrence) => matchesFilter(occurrence, filter));
  }, [filter, occurrenceIndex, pastList, selectedDate, tab, upcomingList]);

  const dayIndicators = useMemo(() => {
    const map = new Map<string, { count: number; hasExam: boolean }>();
    for (const occurrence of monthWindow.occurrences) {
      if (occurrence.status === 'canceled') continue;
      const span = occurrenceDateSpan(occurrence);
      for (let day = span.first; day <= span.last; day = addDays(day, 1)) {
        const previous = map.get(day) ?? { count: 0, hasExam: false };
        map.set(day, {
          count: previous.count + 1,
          hasExam: previous.hasExam || occurrence.isExam,
        });
      }
    }
    return map;
  }, [monthWindow.occurrences]);

  /* ─── Deep link ?item=<eventId> ─── */
  useEffect(() => {
    const itemId = new URLSearchParams(window.location.search).get('item');
    if (!itemId || anchoredItemRef.current === itemId) return;
    const match =
      upcomingWindow.occurrences.find((o) => o.eventId === itemId) ??
      pastWindow.occurrences.find((o) => o.eventId === itemId);
    if (!match) {
      if (!upcomingWindow.isLoading && recordsById.has(itemId) && tab !== 'past') setTab('past');
      return;
    }
    anchoredItemRef.current = itemId;
    if (isOccurrenceExpired(match, now)) setTab('past');
    setSelectedKey(match.key);
    setSelectedSnapshot(match);
  }, [
    now,
    pastWindow.occurrences,
    recordsById,
    tab,
    upcomingWindow.isLoading,
    upcomingWindow.occurrences,
  ]);

  /* ─── Selection and overlays ─── */
  const selectOccurrence = (occurrence: EventOccurrence) => {
    setSelectedKey(occurrence.key);
    setSelectedSnapshot(occurrence);
    // Phones show details in the full-screen reader instead of the side pane.
    if (!isDesktop) setReaderOccurrence(occurrence);
  };

  const openEditor = (request: EditorRequest) => {
    setEditorKey((key) => key + 1);
    setEditorRequest(request);
  };

  const openEditFor = (occurrence: EventOccurrence) => {
    const record = recordsById.get(occurrence.eventId);
    if (!record) {
      setActionError('This event is still loading. Try again in a moment.');
      return;
    }
    if (occurrence.kind === 'class' && occurrence.originalWeek) {
      openEditor({ mode: 'edit-occurrence', record, occurrence });
    } else {
      openEditor({ mode: 'edit-event', record });
    }
  };

  const openDraft = (
    draft: EventDraftRecord,
    options?: { initialError?: string; staleConflict?: boolean },
  ) => {
    openEditor({
      mode: 'draft',
      draft,
      record: draft.sourceEventId ? (recordsById.get(draft.sourceEventId) ?? null) : null,
      ...options,
    });
  };

  const handleSaved = (result: EditorSaveResult) => {
    setEditorRequest(null);
    setActionError('');
    if (result.occurrenceKey) {
      setSelectedKey(result.occurrenceKey);
      setSelectedSnapshot(null);
    }
    if (Date.parse(result.startAt) < nowMs && tab === 'upcoming') setTab('past');
  };

  const switchDashboard = (next: 'regular' | 'school') => {
    if (next === dashboard) return;
    if (next === 'school') {
      regularScrollRef.current = window.scrollY;
      setDashboard('school');
      return;
    }
    setDashboard('regular');
    const restore = regularScrollRef.current;
    window.requestAnimationFrame(() => window.scrollTo({ top: restore }));
  };

  const confirmScopeAction = async () => {
    if (!scopeAction) return;
    const { action, occurrence } = scopeAction;
    const record = recordsById.get(occurrence.eventId);
    if (!record || !occurrence.originalWeek) return;
    try {
      const result = await occurrenceMutation.mutateAsync({
        id: record.id,
        mutation: {
          action,
          originalWeek: occurrence.originalWeek,
          scope: occurrence.isRepeating ? scopeChoice : 'this-week',
          expectedRevision: record.revision,
        },
      });
      setScopeAction(null);
      setStatusMessage(
        action === 'cancel'
          ? 'Class canceled. It stays visible, marked as canceled.'
          : result.removed
            ? 'Class deleted.'
            : 'Class removed for the chosen weeks.',
      );
      if (action === 'delete') {
        setSelectedKey(null);
        setReaderOccurrence(null);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update this class.');
      setScopeAction(null);
    }
  };

  const deleteOrdinary = (occurrence: EventOccurrence) => {
    setActionError('');
    deleteMutation.mutate(occurrence.eventId, {
      onSuccess: () => {
        setSelectedKey(null);
        setReaderOccurrence(null);
        setStatusMessage('Event deleted.');
      },
      onError: (error) =>
        setActionError(
          error instanceof Error ? error.message : 'Could not delete this event right now.',
        ),
    });
  };

  const requestDelete = (occurrence: EventOccurrence) => {
    if (occurrence.kind === 'class') {
      setScopeChoice('this-week');
      setScopeAction({ action: 'delete', occurrence });
    } else {
      deleteOrdinary(occurrence);
    }
  };

  /* ─── Drafts ─── */
  const handlePublishDraft = async (draft: EventDraftRecord) => {
    setActionError('');
    setStatusMessage('');
    if (!isEventDraftPublishable(draft.values, { hasSource: Boolean(draft.sourceEventId) })) {
      openDraft(draft, { initialError: 'Complete the required fields before adding to schedule.' });
      return;
    }
    try {
      const published = await publishDraftMutation.mutateAsync({ id: draft.id });
      setSelectedKey(
        draft.occurrence
          ? `${published.event.id}@${draft.occurrence.originalWeek}`
          : published.event.id,
      );
      setStatusMessage(
        published.mode === 'update' ? 'Changes applied to schedule.' : 'Event added to schedule.',
      );
    } catch (error) {
      if (error instanceof ClientApiError && error.code === 'CONFLICT') {
        openDraft(draft, { initialError: error.message, staleConflict: true });
        return;
      }
      setActionError(
        error instanceof Error ? error.message : 'Could not publish this draft right now.',
      );
    }
  };

  const handleDeleteDraft = async (draft: EventDraftRecord) => {
    setActionError('');
    try {
      await deleteDraftMutation.mutateAsync(draft.id);
      setStatusMessage('Draft deleted.');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Could not delete this draft right now.',
      );
    }
  };

  const handleImportBrowserDrafts = async () => {
    if (isImportingBrowserDrafts || browserDrafts.length === 0) return;
    setIsImportingBrowserDrafts(true);
    let imported = 0;
    let failed = 0;
    let firstError = '';
    for (const entry of browserDrafts) {
      try {
        await saveDraftMutation.mutateAsync({
          sourceEventId: entry.recordId,
          sourceUpdatedAt: entry.recordUpdatedAt,
          values: entry.values,
          importKey: entry.importKey,
        });
        removeBrowserDraftKey(entry.storageKey);
        imported += 1;
      } catch (error) {
        failed += 1;
        if (!firstError) {
          firstError =
            error instanceof Error ? error.message : 'Server could not store this draft.';
        }
      }
    }
    refreshBrowserDrafts();
    setIsImportingBrowserDrafts(false);
    if (failed > 0) {
      setActionError(
        imported > 0
          ? `Imported ${imported} browser draft(s); ${failed} failed and were kept locally (${firstError}).`
          : `Could not import browser drafts (${firstError}). Local copies were kept.`,
      );
    } else if (imported > 0) {
      setStatusMessage(
        imported === 1 ? 'Imported 1 browser draft.' : `Imported ${imported} browser drafts.`,
      );
    }
  };

  /* ─── Render helpers ─── */
  const header = (
    <section className={styles.masthead} aria-labelledby="events-page-heading">
      <Image
        src="/visuals/events/manta-in-the-current.svg"
        alt=""
        aria-hidden="true"
        width={480}
        height={300}
        loading="eager"
        unoptimized
        className={styles.mantaBackdrop}
      />
      <div className={styles.mastheadText}>
        <div className="mb-2 inline-flex items-center gap-2 text-[length:var(--fs-small)] font-medium text-ws-accent">
          <CalendarIcon size={15} strokeWidth={1.6} aria-hidden="true" />
          <span>Schedule &amp; milestones</span>
        </div>
        <h1 id="events-page-heading" className={styles.displayTitle}>
          Events <span className={styles.displayTitleEmphasis}>&amp; schedule</span>
        </h1>
        <p className="mt-3 text-[length:var(--fs-ui)] text-ws-text-muted tabular-nums">
          {stats.upcomingCount} upcoming ({horizonLabel}) · {stats.thisWeekCount} this week ·{' '}
          {stats.upcomingExamsCount} upcoming {stats.upcomingExamsCount === 1 ? 'exam' : 'exams'}{' '}
          <span className="whitespace-nowrap">(next 7 days)</span>
        </p>
      </div>

      <div className="relative z-1 flex flex-wrap items-center gap-2.5">
        {clockLabel ? (
          <div className="inline-flex items-center gap-1.5 rounded-pill border border-ws-border bg-ws-surface px-3.5 py-2 text-[length:var(--fs-small)] text-ws-text tabular-nums">
            <Clock size={14} className="shrink-0 text-ws-accent" aria-hidden="true" />
            <span>{clockLabel}</span>
          </div>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CalendarRange size={15} aria-hidden="true" />}
          onClick={() => setCalendarOpen(true)}
        >
          Week calendar
        </Button>
        <Button
          variant={dashboard === 'school' ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={dashboard === 'school'}
          leftIcon={<GraduationCap size={15} aria-hidden="true" />}
          onClick={() => switchDashboard(dashboard === 'school' ? 'regular' : 'school')}
        >
          School timetable
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} aria-hidden="true" />}
          onClick={() => openEditor({ mode: 'create-event', date: selectedDate ?? today })}
        >
          New event
        </Button>
      </div>
    </section>
  );

  const renderMonthCalendar = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.4rem] font-medium leading-tight text-ws-text">
            {formatMonthTitle(calendarMonth)}
          </h2>
          <p className="text-[length:var(--fs-micro)] text-ws-text-muted">
            Select a day to filter the agenda
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCalendarMonth((month) => shiftMonthKey(month, -1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-ws-border bg-ws-surface text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            <ChevronLeft size={16} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCalendarMonth(monthKeyFromDateStr(today))}
            className="min-h-9 rounded-pill border border-ws-border bg-ws-surface px-2.5 text-[length:var(--fs-micro)] font-medium text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCalendarMonth((month) => shiftMonthKey(month, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-ws-border bg-ws-surface text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            <ChevronRight size={16} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div role="grid" aria-label={`Calendar for ${formatMonthTitle(calendarMonth)}`}>
        <div className={cn(styles.calendarGrid, 'mb-1')}>
          {WEEKDAY_SHORT.map((day) => (
            <div
              key={day}
              aria-hidden="true"
              className="py-1 text-center text-[length:var(--fs-micro)] font-medium text-ws-text-muted"
            >
              {day.slice(0, 1)}
            </div>
          ))}
        </div>
        <div className={styles.calendarGrid}>
          {monthDays.map((cell) => {
            const info = dayIndicators.get(cell.dateStr);
            const isSelected = selectedDate === cell.dateStr;
            const isToday = today === cell.dateStr;
            const label = [formatDayHeader(cell.dateStr)];
            if (info?.count) {
              label.push(pluralize(info.count, 'event'));
              if (info.hasExam) label.push('includes exam');
            }
            return (
              <button
                key={cell.dateStr}
                type="button"
                aria-label={label.join(', ')}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                onClick={() => {
                  setSelectedDate(isSelected ? null : cell.dateStr);
                  if (tab === 'drafts') setTab('upcoming');
                }}
                className={cn(
                  styles.calendarCell,
                  'text-[length:var(--fs-small)] tabular-nums',
                  !cell.inMonth && !isSelected && styles.calendarCellMuted,
                  isToday && !isSelected && styles.calendarCellToday,
                  isSelected && styles.calendarCellSelected,
                )}
              >
                <span>{cell.dayNum}</span>
                <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
                  {info?.count ? (
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-pill',
                        isSelected
                          ? 'bg-ws-surface'
                          : info.hasExam
                            ? 'bg-status-due-soon'
                            : 'bg-ws-accent',
                      )}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAgendaRow = (occurrence: EventOccurrence) => {
    const isSelected = selectedKey === occurrence.key;
    const preview = occurrence.notes ? extractNotePlainText(occurrence.notes) : '';
    return (
      <li key={occurrence.key}>
        <button
          id={`item-${occurrence.eventId}`}
          type="button"
          aria-pressed={isSelected}
          onClick={() => selectOccurrence(occurrence)}
          className={cn(styles.eventRow, isSelected && styles.eventRowSelected)}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="flex flex-wrap items-center gap-1.5">
              <KindBadge occurrence={occurrence} />
              <StatusBadges occurrence={occurrence} now={now} />
            </span>
            <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
              {formatRelativeEventTime(occurrence.startAt, now)}
            </span>
          </div>
          <h3
            className={cn(
              styles.eventTitle,
              occurrence.status === 'canceled' && 'line-through opacity-70',
            )}
          >
            {occurrence.title}
          </h3>
          {preview ? (
            <p className="mt-1.5 line-clamp-2 text-[length:var(--fs-small)] text-ws-text-muted [overflow-wrap:anywhere]">
              {preview}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={14} className="shrink-0 text-ws-accent" aria-hidden="true" />
              <span>
                {formatShortDay(localDateOf(occurrence.startAt))} · {formatTime(occurrence.startAt)}
                {occurrence.endAt ? `–${formatTime(occurrence.endAt)}` : ''}
              </span>
            </span>
            {occurrence.location ? (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <MapPin size={14} className="shrink-0 text-ws-accent" aria-hidden="true" />
                <span className="truncate">{occurrence.location}</span>
              </span>
            ) : null}
          </div>
        </button>
      </li>
    );
  };

  const activeWindow = selectedDate ? monthWindow : tab === 'past' ? pastWindow : upcomingWindow;

  const renderDrafts = () => (
    <div className="space-y-4">
      {browserDrafts.length > 0 ? (
        <div className={styles.draftImportBanner} role="region" aria-label="Browser draft import">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[length:var(--fs-small)] font-medium text-ws-text">
                {browserDrafts.length === 1
                  ? '1 event draft found in browser storage.'
                  : `${browserDrafts.length} event drafts found in browser storage.`}
              </p>
              <p className="text-[length:var(--fs-micro)] text-ws-text-muted">
                Import them into saved drafts. Any draft that fails to import stays stored locally.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={isImportingBrowserDrafts}
              onClick={() => void handleImportBrowserDrafts()}
            >
              {isImportingBrowserDrafts ? 'Importing…' : 'Import browser drafts'}
            </Button>
          </div>
        </div>
      ) : null}
      {draftsQuery.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-small)] text-text-overdue"
        >
          <span>Could not load saved drafts right now.</span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} aria-hidden="true" />}
            onClick={() => void draftsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {draftsQuery.isLoading && drafts.length === 0 ? (
        <div className="space-y-3" aria-label="Loading drafts">
          <Skeleton className="h-24 w-full rounded-item" />
          <Skeleton className="h-24 w-full rounded-item" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <Image
            src="/visuals/events/hermit-shell-haven.svg"
            alt=""
            aria-hidden="true"
            width={320}
            height={280}
            loading="eager"
            unoptimized
            className={styles.emptyShellArt}
          />
          <h2 className="font-display text-[1.5rem] font-medium text-ws-text">
            No saved drafts yet.
          </h2>
          <p className="max-w-md text-[length:var(--fs-ui)] text-ws-text-muted">
            Save an unfinished event or edit and it waits here without cluttering your calendar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Saved event drafts">
          {drafts.map((draft) => {
            const source = draft.sourceEventId
              ? (recordsById.get(draft.sourceEventId) ?? null)
              : null;
            const isEditDraft = draft.sourceEventId !== null;
            const missingSource =
              isEditDraft && !eventsQuery.isLoading && !eventsQuery.isError && !source;
            const stale = Boolean(
              source &&
              ((draft.sourceRevision !== null && draft.sourceRevision !== source.revision) ||
                (draft.sourceRevision === null &&
                  draft.sourceUpdatedAt &&
                  source.updatedAt !== draft.sourceUpdatedAt)),
            );
            const preview = draft.values.notes ? extractNotePlainText(draft.values.notes) : '';
            const publishable = isEventDraftPublishable(draft.values, { hasSource: isEditDraft });
            return (
              <li key={draft.id} className={styles.draftCard}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {draft.values.kind === 'class' || draft.values.category ? (
                      <KindBadge
                        occurrence={{
                          kind: draft.values.kind,
                          category: draft.values.category,
                          isExam: draft.values.isExam,
                        }}
                      />
                    ) : null}
                    <span className="inline-flex items-center rounded-pill border border-ws-border bg-ws-surface px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
                      {isEditDraft
                        ? draft.occurrence
                          ? `Class edit · week of ${formatShortDay(draft.occurrence.originalWeek)}${
                              draft.occurrence.scope === 'this-week-onward' ? ' onward' : ''
                            }`
                          : 'Edit draft'
                        : 'New draft'}
                    </span>
                    {stale ? (
                      <span className="inline-flex items-center gap-1 rounded-pill border border-tint-due-soon-border bg-tint-due-soon-bg px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium text-text-due-soon">
                        <AlertTriangle size={12} aria-hidden="true" />
                        <span>Stale — source changed</span>
                      </span>
                    ) : null}
                    {missingSource ? (
                      <span className="inline-flex items-center gap-1 rounded-pill border border-tint-overdue-border bg-tint-overdue-bg px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium text-text-overdue">
                        <AlertTriangle size={12} aria-hidden="true" />
                        <span>Original event missing</span>
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                    Saved {formatTimestamp(draft.updatedAt)}
                  </span>
                </div>
                <h3 className={styles.eventTitle}>
                  {draft.values.title.trim() || 'Untitled event'}
                </h3>
                {source ? (
                  <p className="mt-1 text-[length:var(--fs-micro)] text-ws-text-muted">
                    Editing: {source.title}
                  </p>
                ) : null}
                {preview ? (
                  <p className="mt-1.5 line-clamp-2 text-[length:var(--fs-small)] text-ws-text-muted [overflow-wrap:anywhere]">
                    {preview}
                  </p>
                ) : null}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
                  <span>
                    {draft.values.date || 'No date'} · {draft.values.time || 'No time'}
                    {draft.values.endTime ? `–${draft.values.endTime}` : ''}
                  </span>
                  {draft.values.location.trim() ? (
                    <span className="truncate">{draft.values.location.trim()}</span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ws-border pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-overdue hover:bg-tint-overdue-bg"
                    onClick={() => void handleDeleteDraft(draft)}
                  >
                    Delete
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openDraft(draft)}>
                      Resume
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={publishDraftMutation.isPending}
                      onClick={() =>
                        publishable
                          ? void handlePublishDraft(draft)
                          : openDraft(draft, {
                              initialError:
                                'Complete the required fields before adding to schedule.',
                            })
                      }
                    >
                      {isEditDraft ? 'Apply changes' : 'Add to schedule'}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const renderAgenda = () => {
    if (tab === 'drafts') return renderDrafts();
    if ((!clockReady || activeWindow.isLoading) && visibleAgenda.length === 0) {
      return (
        <div className="space-y-3" aria-label="Loading events">
          <Skeleton className="h-24 w-full rounded-item" />
          <Skeleton className="h-24 w-full rounded-item" />
          <Skeleton className="h-24 w-full rounded-item" />
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {!selectedDate ? (
          <p className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
            {tab === 'past' ? `Past · ${pastLabel}` : `Upcoming · ${horizonLabel}`} ·{' '}
            {pluralize(visibleAgenda.length, 'item')}
          </p>
        ) : null}
        {visibleAgenda.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <Image
              src="/visuals/events/hermit-shell-haven.svg"
              alt=""
              aria-hidden="true"
              width={320}
              height={280}
              loading="eager"
              unoptimized
              className={styles.emptyShellArt}
            />
            <h2 className="font-display text-[1.5rem] font-medium text-ws-text">
              {eventsQuery.isError || activeWindow.isError
                ? 'Schedule unavailable right now.'
                : selectedDate
                  ? `Nothing on ${formatShortDay(selectedDate)}.`
                  : tab === 'past'
                    ? 'No past events in this range.'
                    : 'No upcoming events in this range.'}
            </h2>
            <p className="max-w-md text-[length:var(--fs-ui)] text-ws-text-muted">
              {selectedDate
                ? 'Clear the day filter to see the full horizon, or add an event on this date.'
                : 'Your harbor is quiet. Load more weeks or add an exam, meeting, deadline, or contest.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {selectedDate ? (
                <Button variant="secondary" size="sm" onClick={() => setSelectedDate(null)}>
                  Show all upcoming
                </Button>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                onClick={() => openEditor({ mode: 'create-event', date: selectedDate ?? today })}
              >
                Add event
              </Button>
            </div>
          </div>
        ) : (
          <ul
            aria-label="Events agenda"
            className={cn(
              'space-y-3',
              tab === 'past' &&
                !selectedDate &&
                visibleAgenda.length > 3 &&
                styles.pastEventsScroller,
            )}
          >
            {visibleAgenda.map(renderAgendaRow)}
          </ul>
        )}
        {!selectedDate ? (
          <div className="flex justify-center pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={activeWindow.isLoading}
              onClick={() =>
                tab === 'past'
                  ? setPastWeeks((weeks) => weeks + BATCH_WEEKS)
                  : setUpcomingWeeks((weeks) => weeks + BATCH_WEEKS)
              }
            >
              {tab === 'past' ? 'Load older (12 weeks)' : 'Load more (12 weeks)'}
            </Button>
          </div>
        ) : null}
      </div>
    );
  };

  const loadFailed = eventsQuery.isError || upcomingWindow.isError;

  return (
    <div className={styles.pageStack}>
      <Image
        src="/visuals/events/kelp-ribbon-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.kelpEdgeDecor}
      />

      {header}

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          <span>Could not load your schedule right now. Check connection or retry.</span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} aria-hidden="true" />}
            onClick={() => {
              void eventsQuery.refetch();
              upcomingWindow.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {actionError ? (
        <div
          role="alert"
          className="rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          {actionError}
        </div>
      ) : null}
      {statusMessage ? (
        <div
          role="status"
          className="rounded-card border border-ws-border bg-ws-accent-soft px-4 py-3 text-[length:var(--fs-small)] text-ws-text"
        >
          {statusMessage}
        </div>
      ) : null}

      {dashboard === 'school' ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={15} aria-hidden="true" />}
            onClick={() => switchDashboard('regular')}
          >
            Back to Events dashboard
          </Button>
          <SchoolTimetable
            weekStart={timetableWeek}
            today={today}
            onWeekChange={setTimetableWeek}
            onOpenOccurrence={(occurrence) => {
              setSelectedKey(occurrence.key);
              setSelectedSnapshot(occurrence);
              setReaderOccurrence(occurrence);
            }}
            onCreateClass={(date, periodIndex) =>
              openEditor({ mode: 'create-class', date, periodIndex })
            }
          />
        </div>
      ) : (
        <>
          <HighlightsSection
            highlights={highlights}
            rangeLabel={horizonLabel}
            now={now}
            selectedKey={selectedKey}
            isLoading={!clockReady || upcomingWindow.isLoading}
            onSelect={selectOccurrence}
          />

          <div className="md:hidden">
            <div className={styles.supportSurface}>
              <button
                type="button"
                aria-expanded={mobileCalendarOpen}
                onClick={() => setMobileCalendarOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-2 text-left cursor-pointer"
              >
                <span>
                  <span className="block font-display text-[1.25rem] font-medium leading-tight text-ws-text">
                    {selectedDate
                      ? `Filtered: ${formatShortDay(selectedDate)}`
                      : formatMonthTitle(calendarMonth)}
                  </span>
                  <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
                    Month calendar
                  </span>
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-ws-accent-soft text-ws-text">
                  {mobileCalendarOpen ? (
                    <ChevronUp size={16} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={16} aria-hidden="true" />
                  )}
                </span>
              </button>
              {mobileCalendarOpen ? (
                <div className="mt-4 border-t border-ws-border pt-4">{renderMonthCalendar()}</div>
              ) : null}
            </div>
          </div>

          <section className={styles.workspaceGrid} aria-label="Agenda and calendar">
            <div className={styles.agendaSurface}>
              <div className={cn(styles.controlsBand, 'mb-4 border-b border-ws-border pb-4')}>
                <div
                  role="tablist"
                  aria-label="Agenda view"
                  className="inline-flex max-w-full flex-wrap items-center gap-0.5 self-start rounded-pill border border-ws-border bg-ws-accent-soft p-1 sm:gap-1"
                >
                  {(['upcoming', 'past', 'drafts'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={tab === value}
                      onClick={() => {
                        setTab(value);
                        setSelectedDate(null);
                        setStatusMessage('');
                      }}
                      className={cn(
                        'min-h-9 whitespace-nowrap rounded-pill px-3 py-1.5 text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-fast)] sm:px-3.5',
                        tab === value
                          ? 'bg-ws-surface text-ws-text shadow-card'
                          : 'text-ws-text-muted hover:text-ws-text',
                      )}
                    >
                      {value === 'upcoming' ? (
                        'Upcoming'
                      ) : value === 'past' ? (
                        'Past'
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span>Drafts</span>
                          {drafts.length > 0 ? (
                            <span
                              aria-label={`${drafts.length} saved`}
                              className="inline-flex min-w-5 items-center justify-center rounded-pill bg-ws-accent px-1.5 py-0.5 text-[0.7rem] font-semibold leading-none text-ws-surface tabular-nums"
                            >
                              {drafts.length}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {tab !== 'drafts' ? (
                  <div
                    role="group"
                    aria-label="Event category filter"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    {FILTERS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                        className={cn(
                          'min-h-9 rounded-pill border px-3 py-1 text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-instant)]',
                          filter === value
                            ? 'border-ws-accent bg-ws-accent text-ws-surface'
                            : 'border-ws-border bg-ws-surface text-ws-text-muted hover:text-ws-text',
                        )}
                      >
                        {FILTER_LABEL[value]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {selectedDate ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-item border border-ws-border bg-ws-accent-soft px-3.5 py-2.5">
                  <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                    Showing {formatDayHeader(selectedDate)}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedDate(null)}>
                    Show all
                  </Button>
                </div>
              ) : null}

              {renderAgenda()}
            </div>

            <aside className={styles.supportColumn} aria-label="Calendar and details">
              <div className={styles.supportSurface}>
                {selectedOccurrence ? (
                  <EventDetailPane
                    occurrence={selectedOccurrence}
                    now={now}
                    busy={occurrenceMutation.isPending || deleteMutation.isPending}
                    onClose={() => setSelectedKey(null)}
                    onOpenReader={setReaderOccurrence}
                    onEdit={openEditFor}
                    onDelete={requestDelete}
                    onCancelClass={(occurrence) => {
                      setScopeChoice('this-week');
                      setScopeAction({ action: 'cancel', occurrence });
                    }}
                  />
                ) : (
                  renderMonthCalendar()
                )}
              </div>
              <Image
                src="/visuals/events/coral-garden.svg"
                alt=""
                aria-hidden="true"
                width={240}
                height={240}
                loading="eager"
                unoptimized
                className={styles.coralFooterAccent}
              />
            </aside>
          </section>
        </>
      )}

      <div className={styles.tidalDividerWrap} aria-hidden="true">
        <Image
          src="/visuals/events/tidal-lace.svg"
          alt=""
          width={720}
          height={100}
          loading="eager"
          unoptimized
          className={styles.tidalDivider}
        />
      </div>

      <WeekCalendarPanel
        open={calendarOpen}
        state={calendarState}
        today={today}
        now={now}
        onChange={setCalendarState}
        onClose={() => setCalendarOpen(false)}
        onSelect={(occurrence) => {
          setSelectedKey(occurrence.key);
          setSelectedSnapshot(occurrence);
          setReaderOccurrence(occurrence);
        }}
      />

      <EventReader
        occurrence={readerOccurrence}
        now={now}
        onClose={() => setReaderOccurrence(null)}
        onEdit={(occurrence) => {
          setReaderOccurrence(null);
          openEditFor(occurrence);
        }}
      />

      <Dialog
        open={Boolean(scopeAction)}
        onClose={() => setScopeAction(null)}
        portal
        title={scopeAction?.action === 'cancel' ? 'Cancel class' : 'Delete class'}
        description={
          scopeAction
            ? `${scopeAction.occurrence.title} · ${formatDayHeader(localDateOf(scopeAction.occurrence.startAt))}${
                scopeAction.action === 'cancel'
                  ? '. Canceled classes stay visible, struck through, and free their timetable cell.'
                  : '. Deleted occurrences disappear; earlier weeks and other classes are kept.'
              }`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setScopeAction(null)}>
              Keep class
            </Button>
            <Button
              variant={scopeAction?.action === 'delete' ? 'destructive-solid' : 'primary'}
              size="sm"
              disabled={occurrenceMutation.isPending}
              onClick={() => void confirmScopeAction()}
            >
              {scopeAction?.action === 'cancel' ? 'Cancel class' : 'Delete'}
            </Button>
          </>
        }
      >
        {scopeAction?.occurrence.isRepeating ? (
          <fieldset className="space-y-2">
            <legend className="text-[length:var(--fs-small)] font-medium text-ws-text">
              Apply to
            </legend>
            {(['this-week', 'this-week-onward'] as const).map((value) => (
              <label
                key={value}
                className="flex items-center gap-2 text-[length:var(--fs-small)] text-ws-text"
              >
                <input
                  type="radio"
                  name="class-scope"
                  checked={scopeChoice === value}
                  onChange={() => setScopeChoice(value)}
                />
                {value === 'this-week' ? 'This week only' : 'This week onward'}
              </label>
            ))}
          </fieldset>
        ) : null}
      </Dialog>

      {editorRequest ? (
        <EventEditorDialog
          key={editorKey}
          request={editorRequest}
          drafts={drafts}
          sourceLoaded={!eventsQuery.isLoading && !eventsQuery.isError}
          onClose={() => setEditorRequest(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
