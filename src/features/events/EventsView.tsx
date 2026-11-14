'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Repeat,
  RotateCcw,
  Video,
  X,
} from 'lucide-react';
import {
  clearEditorDraft,
  isEditorDraftStale,
  listSavedEditDraftRecordIds,
  loadEditorDraft,
  saveEditorDraft,
  type EditorDraftPayload,
} from '@/client/editor-drafts';
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '@/client/queries/events';
import type { EventCategory, EventItem } from '@/contracts/event';
import {
  formatMonthTitle,
  getAgendaEventsForState,
  getMonthGridDays,
  getWeekDaysForAnchor,
  matchesEventCategory,
  monthKeyFromDateStr,
  shiftMonthKey,
  type EventHorizon,
} from '@/domain/event-calendar';
import {
  computeEventStats,
  formatRelativeEventTime,
  getUpcomingExams,
} from '@/domain/event-domain';
import {
  buildZonedInstant,
  DEFAULT_APP_TIMEZONE,
  formatScheduledDate,
  shiftScheduledDate,
} from '@/domain/time';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { Skeleton } from '@/ui/Skeleton';
import { useItemAnchor } from '@/ui/use-item-anchor';
import { eventEditorPatch, eventEditorValues } from './event-editor';
import styles from './events.module.css';

type EventEditorValues = ReturnType<typeof eventEditorValues>;

const FALLBACK_TODAY = '2026-11-13';
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const CATEGORY_LABELS: Record<'all' | EventCategory, string> = {
  all: 'All',
  exam: 'Exams',
  school: 'School',
  meeting: 'Meetings',
  deadline: 'Deadlines',
};

const VALID_CATEGORIES = new Set<EventCategory>(['exam', 'school', 'meeting', 'deadline']);

function isEventDraftValues(raw: unknown): raw is EventEditorValues {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const value = raw as Record<string, unknown>;
  return (
    typeof value.title === 'string' &&
    typeof value.category === 'string' &&
    VALID_CATEGORIES.has(value.category as EventCategory) &&
    typeof value.date === 'string' &&
    typeof value.time === 'string' &&
    typeof value.location === 'string' &&
    typeof value.isOnline === 'boolean' &&
    typeof value.isExam === 'boolean' &&
    typeof value.notes === 'string'
  );
}

function defaultEditorValues(selectedDate: string | null, fallbackDate: string): EventEditorValues {
  return {
    title: '',
    category: 'school',
    date: selectedDate ?? fallbackDate,
    time: '09:00',
    location: '',
    isOnline: false,
    isExam: false,
    notes: '',
  };
}

function sameEditorValues(a: EventEditorValues, b: EventEditorValues): boolean {
  return (
    a.title === b.title &&
    a.category === b.category &&
    a.date === b.date &&
    a.time === b.time &&
    a.location === b.location &&
    a.isOnline === b.isOnline &&
    a.isExam === b.isExam &&
    a.notes === b.notes
  );
}

function formatZonedDayHeader(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(new Date(`${dateStr}T12:00:00+07:00`));
}

function formatShortDay(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(new Date(`${dateStr}T12:00:00+07:00`));
}

function formatZonedTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatZonedFullDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function formatDraftTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return 'recently';
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

function CategoryBadge({ category, isExam }: { category: EventCategory; isExam?: boolean }) {
  const icon =
    category === 'exam' || isExam ? (
      <GraduationCap size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : category === 'meeting' ? (
      <Video size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : category === 'deadline' ? (
      <Clock size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : (
      <CalendarIcon size={12} strokeWidth={1.6} aria-hidden="true" />
    );

  const toneClass =
    category === 'exam' || isExam
      ? 'bg-tint-due-soon-bg text-text-due-soon border-tint-due-soon-border'
      : 'bg-ws-accent-soft text-ws-text border-ws-border';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium',
        toneClass,
      )}
    >
      {icon}
      <span>
        {category === 'exam'
          ? 'Exam'
          : category === 'meeting'
            ? 'Meeting'
            : category === 'deadline'
              ? 'Deadline'
              : 'School'}
      </span>
    </span>
  );
}

export function EventsView() {
  const { data: events = [], isLoading, isError: loadFailed, refetch } = useEvents();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const savingRef = useRef(false);
  const editorTitleInputRef = useRef<HTMLInputElement>(null);
  const anchoredItemHandledRef = useRef<string | null>(null);
  const initialDateSyncedRef = useRef(false);

  const [todayStr, setTodayStr] = useState(FALLBACK_TODAY);
  const [currentTime, setCurrentTime] = useState('');
  const [agendaNowMs, setAgendaNowMs] = useState(() => Date.parse(`${FALLBACK_TODAY}T00:00:00+07:00`));

  const [horizon, setHorizon] = useState<EventHorizon>('upcoming');
  const [activeCategory, setActiveCategory] = useState<'all' | EventCategory>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyFromDateStr(FALLBACK_TODAY));
  const [weekAnchorDate, setWeekAnchorDate] = useState(FALLBACK_TODAY);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [savedEventOverride, setSavedEventOverride] = useState<EventItem | null>(null);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(min-width: 768px)');
    if (!mq || typeof mq.addEventListener !== 'function') {
      return undefined;
    }
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const zonedDate = formatScheduledDate(now, DEFAULT_APP_TIMEZONE);
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: DEFAULT_APP_TIMEZONE,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
      setTodayStr(zonedDate);
      setCurrentTime(formatted);
      setAgendaNowMs(now.getTime());
      if (!initialDateSyncedRef.current) {
        initialDateSyncedRef.current = true;
        setCalendarMonth(monthKeyFromDateStr(zonedDate));
        setWeekAnchorDate(zonedDate);
      }
    };
    updateClock();
    const interval = window.setInterval(updateClock, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  useItemAnchor(events);

  useEffect(() => {
    if (typeof window === 'undefined' || events.length === 0) {
      return;
    }
    const itemId = new URLSearchParams(window.location.search).get('item');
    if (!itemId || anchoredItemHandledRef.current === itemId) {
      return;
    }
    const target = events.find((evt) => evt.id === itemId);
    if (!target) {
      return;
    }
    anchoredItemHandledRef.current = itemId;
    if (Date.parse(target.startAt) < Date.now()) {
      setHorizon('past');
    }
    setSelectedDate(null);
    setSelectedEventId(target.id);
  }, [events]);

  // Editor + explicit local draft state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EventItem | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<EventEditorValues>(() =>
    defaultEditorValues(null, FALLBACK_TODAY),
  );
  const [formValues, setFormValues] = useState<EventEditorValues>(() =>
    defaultEditorValues(null, FALLBACK_TODAY),
  );
  const [editorError, setEditorError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState<EditorDraftPayload<EventEditorValues> | null>(
    null,
  );
  const [draftSyncVersion, setDraftSyncVersion] = useState(0);

  const refreshOrphanedDrafts = useCallback(() => {
    setDraftSyncVersion((v) => v + 1);
  }, []);

  const orphanedDraftIds = useMemo(() => {
    void draftSyncVersion;
    if (isLoading || loadFailed) {
      return [];
    }
    const ids = listSavedEditDraftRecordIds('event');
    return ids.filter((id) => !events.some((evt) => evt.id === id));
  }, [draftSyncVersion, events, isLoading, loadFailed]);

  const agendaNow = useMemo(() => new Date(agendaNowMs), [agendaNowMs]);
  const stats = useMemo(() => computeEventStats(events, agendaNow), [agendaNow, events]);
  const upcomingExams = useMemo(() => getUpcomingExams(events, agendaNow), [agendaNow, events]);

  const categoryMatchedEvents = useMemo(
    () => events.filter((evt) => matchesEventCategory(evt, activeCategory)),
    [events, activeCategory],
  );

  const visibleAgendaEvents = useMemo(
    () =>
      getAgendaEventsForState({
        events,
        horizon,
        categoryFilter: activeCategory,
        selectedDate,
        now: agendaNow,
      }),
    [events, horizon, activeCategory, selectedDate, agendaNow],
  );

  const dayIndicators = useMemo(() => {
    const map = new Map<string, { count: number; hasExam: boolean }>();
    for (const evt of events) {
      const dateStr = formatScheduledDate(evt.startAt, DEFAULT_APP_TIMEZONE);
      const prev = map.get(dateStr) ?? { count: 0, hasExam: false };
      map.set(dateStr, {
        count: prev.count + 1,
        hasExam: prev.hasExam || evt.isExam || evt.category === 'exam',
      });
    }
    return map;
  }, [events]);

  const monthCells = useMemo(() => getMonthGridDays(calendarMonth), [calendarMonth]);
  const weekDays = useMemo(() => getWeekDaysForAnchor(weekAnchorDate), [weekAnchorDate]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) {
      return null;
    }
    const fromQuery = events.find((evt) => evt.id === selectedEventId) ?? null;
    if (
      savedEventOverride &&
      savedEventOverride.id === selectedEventId &&
      (!fromQuery || savedEventOverride.updatedAt >= fromQuery.updatedAt)
    ) {
      return savedEventOverride;
    }
    return fromQuery;
  }, [events, savedEventOverride, selectedEventId]);

  const isEditorDirty = editorOpen && !sameEditorValues(initialFormValues, formValues);

  const handleSelectHorizon = (next: EventHorizon) => {
    setHorizon(next);
    if (next === 'upcoming' || next === 'past') {
      setSelectedDate(null);
    } else if (next === 'week') {
      setWeekAnchorDate(selectedDate ?? todayStr);
    }
  };

  const handleSelectCalendarDay = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(dateStr);
    setWeekAnchorDate(dateStr);
    setCalendarMonth(monthKeyFromDateStr(dateStr));
    if (horizon === 'past') {
      setHorizon('upcoming');
    }
  };

  const handleClearDayToUpcoming = () => {
    setSelectedDate(null);
    setHorizon('upcoming');
  };

  const openCreateEditor = () => {
    const base = defaultEditorValues(selectedDate, todayStr);
    const existing = loadEditorDraft<EventEditorValues>('event', null, isEventDraftValues);
    setEditingRecord(null);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const openEditEditor = (evt: EventItem) => {
    const base = eventEditorValues(evt);
    const existing = loadEditorDraft<EventEditorValues>('event', evt.id, isEventDraftValues);
    setEditingRecord(evt);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const handleSaveDraft = (): DraftSaveOutcome => {
    const result = saveEditorDraft({
      formId: 'event',
      recordId: editingRecord?.id ?? null,
      recordUpdatedAt: editingRecord?.updatedAt ?? null,
      values: formValues,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setLoadedDraft(null);
    setInitialFormValues(formValues);
    refreshOrphanedDrafts();
    return {
      ok: true,
      message: `Draft saved locally (${formatDraftTimestamp(result.draft.savedAt)}).`,
    };
  };

  const handleEditorSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) {
      return;
    }
    if (!formValues.title.trim() || !formValues.date) {
      setEditorError('Enter an event title and date.');
      editorTitleInputRef.current?.focus();
      return;
    }

    savingRef.current = true;
    setIsSubmitting(true);
    setEditorError('');
    setActionError('');

    try {
      if (editingRecord) {
        const patch = eventEditorPatch(editingRecord, formValues);
        const saved = await updateMutation.mutateAsync({
          id: editingRecord.id,
          patch,
        });
        clearEditorDraft('event', editingRecord.id);
        setSavedEventOverride(saved);
        setSelectedEventId(saved.id);
      } else {
        const created = await createMutation.mutateAsync({
          title: formValues.title.trim(),
          category: formValues.category,
          startAt: buildZonedInstant(formValues.date, formValues.time || '09:00'),
          endAt: null,
          locationType: formValues.isOnline ? 'online' : 'in_person',
          location: formValues.location.trim() || null,
          url: null,
          isExam: formValues.isExam || formValues.category === 'exam',
          notes: formValues.notes.trim() || null,
          description: formValues.notes.trim() || null,
        });
        clearEditorDraft('event', null);
        setSavedEventOverride(created);
        setSelectedEventId(created.id);
      }
      refreshOrphanedDrafts();
      setLoadedDraft(null);
      setEditorOpen(false);
      setEditingRecord(null);
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not save this event. Your input is retained.',
      );
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (evt: EventItem) => {
    setActionError('');
    deleteMutation.mutate(evt.id, {
      onSuccess: () => {
        clearEditorDraft('event', evt.id);
        refreshOrphanedDrafts();
        if (savedEventOverride?.id === evt.id) {
          setSavedEventOverride(null);
        }
        setSelectedEventId(null);
      },
      onError: (error) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Could not delete this event right now. Retry when ready.',
        );
      },
    });
  };

  const handleDiscardOrphanedDrafts = () => {
    for (const orphanId of orphanedDraftIds) {
      clearEditorDraft('event', orphanId);
    }
    refreshOrphanedDrafts();
  };

  const agendaEmptyTitle = selectedDate
    ? `No matching events on ${formatShortDay(selectedDate)}.`
    : horizon === 'past'
      ? 'No past events match this filter.'
      : 'No upcoming events yet.';

  const renderCalendarContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.4rem] leading-tight text-ws-text">
            {formatMonthTitle(calendarMonth)}
          </h2>
          <p className="text-[length:var(--fs-micro)] text-ws-text-muted">
            Select a day to filter agenda &amp; week
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCalendarMonth((m) => shiftMonthKey(m, -1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-ws-border bg-ws-surface text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            <ChevronLeft size={16} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCalendarMonth(monthKeyFromDateStr(todayStr));
              setWeekAnchorDate(todayStr);
            }}
            className="min-h-9 rounded-pill border border-ws-border bg-ws-surface px-2.5 text-[length:var(--fs-micro)] font-medium text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCalendarMonth((m) => shiftMonthKey(m, 1))}
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
          {monthCells.map((cell) => {
            const info = dayIndicators.get(cell.dateStr);
            const isSelected = selectedDate === cell.dateStr;
            const isToday = todayStr === cell.dateStr;
            const labelParts = [formatZonedDayHeader(cell.dateStr)];
            if (info?.count) {
              labelParts.push(`${info.count} ${info.count === 1 ? 'event' : 'events'}`);
              if (info.hasExam) labelParts.push('includes exam');
            }
            return (
              <button
                key={cell.dateStr}
                type="button"
                aria-label={labelParts.join(', ')}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                onClick={() => handleSelectCalendarDay(cell.dateStr)}
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

      {upcomingExams.length > 0 && (
        <div className="border-t border-ws-border pt-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-1.5 text-[length:var(--fs-ui)] font-medium text-ws-text">
              <AlertTriangle size={15} className="text-text-due-soon shrink-0" aria-hidden="true" />
              <span>Exam highlights</span>
            </h3>
            <span className="rounded-pill bg-tint-due-soon-bg border border-tint-due-soon-border px-2 py-0.5 text-[length:var(--fs-micro)] font-medium text-text-due-soon">
              {upcomingExams.length} ahead
            </span>
          </div>
          <div className="space-y-2">
            {upcomingExams.slice(0, 3).map((exam) => (
              <button
                key={exam.id}
                type="button"
                onClick={() => setSelectedEventId(exam.id)}
                className={cn(
                  'w-full text-left rounded-item border px-3 py-2.5 transition-colors duration-[var(--dur-fast)] cursor-pointer',
                  selectedEventId === exam.id
                    ? 'border-ws-accent bg-ws-accent-soft'
                    : 'border-tint-due-soon-border bg-tint-due-soon-bg hover:border-ws-accent',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[length:var(--fs-small)] font-medium text-ws-text [overflow-wrap:anywhere]">
                    {exam.title}
                  </span>
                  <span className="shrink-0 text-[length:var(--fs-micro)] font-medium text-text-due-soon tabular-nums">
                    {formatRelativeEventTime(exam.startAt, agendaNow)}
                  </span>
                </div>
                <p className="mt-1 text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                  {formatShortDay(formatScheduledDate(exam.startAt, DEFAULT_APP_TIMEZONE))} ·{' '}
                  {formatZonedTime(exam.startAt)}
                  {exam.location ? ` · ${exam.location}` : ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailContent = (evt: EventItem, onClose: () => void, inModal = false) => (
    <div className="space-y-4">
      {!inModal ? (
        <div className="flex items-center justify-between gap-2 border-b border-ws-border pb-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 min-h-9 rounded-pill px-2.5 text-[length:var(--fs-small)] font-medium text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to calendar</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={evt.category} isExam={evt.isExam} />
            <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
              {formatRelativeEventTime(evt.startAt, agendaNow)}
            </span>
          </div>
          {inModal ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close event details"
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer transition-colors duration-[var(--dur-fast)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {!inModal ? (
          <h2 className="font-display text-[1.7rem] leading-snug text-ws-text [overflow-wrap:anywhere]">
            {evt.title}
          </h2>
        ) : null}
        {evt.description ? (
          <p className="text-[length:var(--fs-ui)] text-ws-text-muted [overflow-wrap:anywhere]">
            {evt.description}
          </p>
        ) : null}
      </div>

      <dl className="space-y-2.5 border-y border-ws-border py-3.5 text-[length:var(--fs-small)]">
        <div className="flex items-start gap-2 text-ws-text">
          <CalendarIcon size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />
          <dd className="tabular-nums">{formatZonedFullDateTime(evt.startAt)} (Saigon)</dd>
        </div>
        {evt.location ? (
          <div className="flex items-start gap-2 text-ws-text-muted">
            {evt.locationType === 'online' ? (
              <Video size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />
            ) : (
              <MapPin size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />
            )}
            <dd className="[overflow-wrap:anywhere]">{evt.location}</dd>
          </div>
        ) : null}
        {evt.url ? (
          <div className="flex items-start gap-2 text-ws-accent">
            <ExternalLink size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <dd className="min-w-0 flex-1 [overflow-wrap:anywhere] underline decoration-ws-border underline-offset-2">
              {evt.url}
            </dd>
          </div>
        ) : null}
        {evt.recurrence ? (
          <div className="flex items-start gap-2 text-ws-text-muted">
            <Repeat size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />
            <dd>
              Repeats {evt.recurrence.frequency}
              {evt.recurrence.until ? ` until ${evt.recurrence.until}` : ''}
            </dd>
          </div>
        ) : null}
        {evt.preparationTaskId ? (
          <div className="flex items-start gap-2 text-ws-text-muted">
            <FileText size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />
            <dd>Linked preparation task ({evt.preparationTaskId})</dd>
          </div>
        ) : null}
      </dl>

      {evt.notes ? (
        <div className="space-y-1.5">
          <h3 className="text-[length:var(--fs-small)] font-medium text-ws-text">
            Notes &amp; instructions
          </h3>
          <p className="whitespace-pre-wrap text-[length:var(--fs-small)] leading-relaxed text-ws-text-muted [overflow-wrap:anywhere]">
            {evt.notes}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-overdue hover:bg-tint-overdue-bg"
          onClick={() => handleDeleteEvent(evt)}
        >
          Delete event
        </Button>
        <Button variant="secondary" size="sm" onClick={() => openEditEditor(evt)}>
          Edit event
        </Button>
      </div>
    </div>
  );

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

      {/* Editorial Aquatic Masthead */}
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
          <div className="inline-flex items-center gap-2 text-[length:var(--fs-small)] font-medium text-ws-accent mb-2">
            <CalendarIcon size={15} strokeWidth={1.6} aria-hidden="true" />
            <span>Schedule &amp; milestones</span>
          </div>
          <h1 id="events-page-heading" className={styles.displayTitle}>
            Events <span className={styles.displayTitleEmphasis}>&amp; exams</span>
          </h1>
          <p className="mt-3 text-[length:var(--fs-ui)] text-ws-text-muted tabular-nums">
            {stats.upcomingCount} upcoming · {stats.thisWeekCount} this week ·{' '}
            {stats.approachingExamsCount} approaching{' '}
            {stats.approachingExamsCount === 1 ? 'exam' : 'exams'}
          </p>
        </div>

        <div className="relative z-1 flex flex-wrap items-center gap-2.5">
          {currentTime ? (
            <div className="inline-flex items-center gap-1.5 rounded-pill border border-ws-border bg-ws-surface px-3.5 py-2 text-[length:var(--fs-small)] text-ws-text tabular-nums">
              <Clock size={14} className="text-ws-accent shrink-0" aria-hidden="true" />
              <span>{currentTime}</span>
            </div>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} aria-hidden="true" />}
            onClick={openCreateEditor}
          >
            New event
          </Button>
        </div>
      </section>

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
            onClick={() => void refetch()}
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

      {orphanedDraftIds.length > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ws-border bg-ws-accent-soft px-4 py-3 text-[length:var(--fs-small)] text-ws-text"
        >
          <span>
            {orphanedDraftIds.length === 1
              ? '1 saved local edit draft refers to an event that is no longer in your schedule.'
              : `${orphanedDraftIds.length} saved local edit drafts refer to events no longer in your schedule.`}
          </span>
          <Button variant="secondary" size="sm" onClick={handleDiscardOrphanedDrafts}>
            Discard missing drafts
          </Button>
        </div>
      ) : null}

      {/* Mobile Calendar Disclosure (< 768px) */}
      <div className="md:hidden">
        <div className={styles.supportSurface}>
          <button
            type="button"
            aria-expanded={mobileCalendarOpen}
            onClick={() => setMobileCalendarOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left cursor-pointer"
          >
            <div>
              <span className="font-display text-[1.25rem] text-ws-text block leading-tight">
                {selectedDate
                  ? `Filtered: ${formatShortDay(selectedDate)}`
                  : formatMonthTitle(calendarMonth)}
              </span>
              <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
                Month calendar &amp; exam highlights
              </span>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-ws-accent-soft text-ws-text">
              {mobileCalendarOpen ? (
                <ChevronUp size={16} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} aria-hidden="true" />
              )}
            </span>
          </button>
          {mobileCalendarOpen ? (
            <div className="mt-4 border-t border-ws-border pt-4">{renderCalendarContent()}</div>
          ) : null}
        </div>
      </div>

      {/* Coordinated Agenda + Calendar/Detail Two-Zone Workspace */}
      <section className={styles.workspaceGrid} aria-label="Agenda and calendar">
        <div className={styles.agendaSurface}>
          <div className={cn(styles.controlsBand, 'pb-4 mb-4 border-b border-ws-border')}>
            <div
              role="tablist"
              aria-label="Agenda view"
              className="inline-flex flex-nowrap whitespace-nowrap items-center gap-0.5 sm:gap-1 rounded-pill bg-ws-accent-soft p-1 border border-ws-border self-start max-w-full"
            >
              {(['upcoming', 'past', 'week'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={horizon === tab}
                  onClick={() => handleSelectHorizon(tab)}
                  className={cn(
                    'min-h-9 whitespace-nowrap rounded-pill px-2 min-[375px]:px-3 sm:px-3.5 py-1.5 text-[0.75rem] min-[375px]:text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-fast)]',
                    horizon === tab
                      ? 'bg-ws-surface text-ws-text shadow-card'
                      : 'text-ws-text-muted hover:text-ws-text',
                  )}
                >
                  {tab === 'upcoming' ? 'Upcoming' : tab === 'past' ? 'Past' : 'Week calendar'}
                </button>
              ))}
            </div>

            <div
              role="tablist"
              aria-label="Event category filter"
              className="flex flex-wrap items-center gap-1.5"
            >
              {(['all', 'exam', 'school', 'meeting', 'deadline'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'min-h-9 rounded-pill border px-3 py-1 text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-instant)]',
                    activeCategory === cat
                      ? 'bg-ws-accent text-ws-surface border-ws-accent'
                      : 'bg-ws-surface text-ws-text-muted border-ws-border hover:text-ws-text',
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {selectedDate ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-item border border-ws-border bg-ws-accent-soft px-3.5 py-2.5">
              <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                Showing events for {formatZonedDayHeader(selectedDate)}
              </span>
              <Button variant="secondary" size="sm" onClick={handleClearDayToUpcoming}>
                Upcoming (show all)
              </Button>
            </div>
          ) : null}

          {isLoading && events.length === 0 ? (
            <div className="space-y-3" aria-label="Loading events">
              <Skeleton className="h-24 w-full rounded-item" />
              <Skeleton className="h-24 w-full rounded-item" />
              <Skeleton className="h-24 w-full rounded-item" />
            </div>
          ) : horizon === 'week' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-[1.45rem] leading-tight text-ws-text">
                    {formatShortDay(weekDays[0]!)} – {formatShortDay(weekDays[6]!)}
                  </h2>
                  <p className="text-[length:var(--fs-micro)] text-ws-text-muted">
                    Monday – Sunday · {DEFAULT_APP_TIMEZONE}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setWeekAnchorDate((d) => shiftScheduledDate(d, -7))}
                  >
                    Previous week
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setWeekAnchorDate(todayStr);
                      setSelectedDate(null);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setWeekAnchorDate((d) => shiftScheduledDate(d, 7))}
                  >
                    Next week
                  </Button>
                </div>
              </div>

              <div className={styles.weekColumns}>
                {weekDays.map((dateStr, idx) => {
                  const dayItems = categoryMatchedEvents
                    .filter(
                      (evt) => formatScheduledDate(evt.startAt, DEFAULT_APP_TIMEZONE) === dateStr,
                    )
                    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
                  const isActive =
                    selectedDate === dateStr || (!selectedDate && todayStr === dateStr);
                  return (
                    <div
                      key={dateStr}
                      className={cn(styles.weekDayBox, isActive && styles.weekDayBoxActive)}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectCalendarDay(dateStr)}
                        className="flex items-baseline justify-between gap-1 text-left border-b border-ws-border pb-1.5 cursor-pointer"
                      >
                        <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                          {WEEKDAY_SHORT[idx]}
                        </span>
                        <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                          {dateStr.slice(8, 10)}
                        </span>
                      </button>
                      <div className="flex flex-col gap-1.5">
                        {dayItems.length === 0 ? (
                          <span className="text-[length:var(--fs-micro)] text-ws-text-muted py-1">
                            Clear
                          </span>
                        ) : (
                          dayItems.map((evt) => (
                            <button
                              key={evt.id}
                              id={`item-${evt.id}`}
                              type="button"
                              onClick={() => setSelectedEventId(evt.id)}
                              className={cn(
                                'w-full text-left rounded-sm border p-2 text-[length:var(--fs-micro)] cursor-pointer transition-colors duration-[var(--dur-instant)]',
                                selectedEventId === evt.id
                                  ? 'border-ws-accent bg-ws-accent-soft'
                                  : 'border-ws-border bg-ws-surface hover:border-ws-accent',
                              )}
                            >
                              <div className="font-medium text-ws-text [overflow-wrap:break-word] line-clamp-2">
                                {evt.title}
                              </div>
                              <div className="mt-0.5 text-ws-text-muted tabular-nums">
                                {formatZonedTime(evt.startAt)}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : visibleAgendaEvents.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center gap-3">
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
              <h2 className="font-display text-[1.5rem] text-ws-text">
                {loadFailed ? 'Schedule unavailable right now.' : agendaEmptyTitle}
              </h2>
              <p className="max-w-md text-[length:var(--fs-ui)] text-ws-text-muted">
                {loadFailed
                  ? 'We could not load events from the server. Retry loading above or try again shortly.'
                  : selectedDate
                    ? 'Switch back to Upcoming to see your full horizon, or add an event on this date.'
                    : 'Your harbor is quiet for now. Add an exam, class milestone, or meeting when ready.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {selectedDate ? (
                  <Button variant="secondary" size="sm" onClick={handleClearDayToUpcoming}>
                    Upcoming (show all)
                  </Button>
                ) : null}
                <Button variant="primary" size="sm" onClick={openCreateEditor}>
                  Add event
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Events agenda">
              {visibleAgendaEvents.map((evt) => {
                const isSelected = selectedEventId === evt.id;
                const eventDay = formatScheduledDate(evt.startAt, DEFAULT_APP_TIMEZONE);
                return (
                  <li key={evt.id}>
                    <button
                      id={`item-${evt.id}`}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={cn(styles.eventRow, isSelected && styles.eventRowSelected)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <CategoryBadge category={evt.category} isExam={evt.isExam} />
                        <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
                          {formatRelativeEventTime(evt.startAt, agendaNow)}
                        </span>
                      </div>

                      <h3 className="font-display text-[1.35rem] leading-snug text-ws-text [overflow-wrap:anywhere]">
                        {evt.title}
                      </h3>

                      {evt.notes ? (
                        <p className="mt-1.5 text-[length:var(--fs-small)] text-ws-text-muted line-clamp-2 [overflow-wrap:anywhere]">
                          {evt.notes}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarIcon
                            size={14}
                            className="text-ws-accent shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {formatShortDay(eventDay)} · {formatZonedTime(evt.startAt)}
                          </span>
                        </span>
                        {evt.location ? (
                          <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                            {evt.locationType === 'online' ? (
                              <Video
                                size={14}
                                className="text-ws-accent shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <MapPin
                                size={14}
                                className="text-ws-accent shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="truncate">{evt.location}</span>
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Supporting Desktop/Tablet Pane */}
        <aside className={styles.supportColumn} aria-label="Supporting calendar and details">
          <div className={styles.supportSurface}>
            {selectedEvent
              ? renderDetailContent(selectedEvent, () => setSelectedEventId(null))
              : renderCalendarContent()}
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

      {/* Quiet shoreline wave divider + mobile closing reef accent */}
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
      <div className="md:hidden">
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
      </div>

      {/* Mobile Focused Event Detail Dialog (< 768px only) */}
      <Dialog
        open={Boolean(selectedEvent) && !isDesktop && !editorOpen}
        onClose={() => setSelectedEventId(null)}
        title={selectedEvent?.title ?? 'Event details'}
        portal
        className="max-w-[92%] max-h-[86dvh] overflow-y-auto"
      >
        {selectedEvent
          ? renderDetailContent(selectedEvent, () => setSelectedEventId(null), true)
          : null}
      </Dialog>

      {/* Shared Centered Two-Column Event Editor + Explicit Local Drafts */}
      <LargeEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingRecord(null);
          setEditorError('');
          setLoadedDraft(null);
        }}
        title={editingRecord ? 'Edit event' : 'New event'}
        description="Dates and times use the Asia/Saigon schedule."
        formId="event-large-editor-form"
        isDirty={isEditorDirty}
        isSubmitting={isSubmitting}
        submitLabel={editingRecord ? 'Save changes' : 'Create event'}
        submittingLabel={editingRecord ? 'Saving…' : 'Creating…'}
        closeAriaLabel="Close event editor"
        initialFocusRef={editorTitleInputRef}
        errorMessage={editorError}
        draftRecovery={
          loadedDraft
            ? {
                savedAtLabel: formatDraftTimestamp(loadedDraft.savedAt),
                stale: Boolean(
                  editingRecord && isEditorDraftStale(loadedDraft, editingRecord.updatedAt),
                ),
                staleMessage:
                  'This event changed on disk after your local draft was saved. Review changes carefully before saving.',
                onResume: () => {
                  setFormValues(loadedDraft.values);
                  setLoadedDraft(null);
                },
                onDiscard: () => {
                  clearEditorDraft('event', editingRecord?.id ?? null);
                  setLoadedDraft(null);
                  refreshOrphanedDrafts();
                },
              }
            : null
        }
        onSaveDraft={handleSaveDraft}
      >
        <form id="event-large-editor-form" onSubmit={handleEditorSubmit}>
          <LargeEditorTwoColumn
            primary={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="event-editor-title"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Title
                  </label>
                  <input
                    ref={editorTitleInputRef}
                    id="event-editor-title"
                    type="text"
                    value={formValues.title}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, title: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="e.g. Calculus I Midterm or Lab Critique"
                    className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-3.5 text-[length:var(--fs-ui)] text-ws-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="event-editor-notes"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Notes &amp; instructions
                  </label>
                  <textarea
                    id="event-editor-notes"
                    rows={7}
                    value={formValues.notes}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Preparation steps, room details, materials, or talking points…"
                    className="w-full max-w-[66ch] rounded-item border border-ws-border bg-ws-surface p-3.5 text-[length:var(--fs-ui)] leading-relaxed text-ws-text"
                  />
                </div>
              </>
            }
            metadata={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="event-editor-category"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Category
                  </label>
                  <select
                    id="event-editor-category"
                    value={formValues.category}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        category: e.target.value as EventCategory,
                      }))
                    }
                    className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-3 text-[length:var(--fs-ui)] text-ws-text"
                  >
                    <option value="school">School</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="event-editor-date"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text"
                    >
                      Date
                    </label>
                    <input
                      id="event-editor-date"
                      type="date"
                      value={formValues.date}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-2.5 text-[length:var(--fs-small)] text-ws-text tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="event-editor-time"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text"
                    >
                      Time
                    </label>
                    <input
                      id="event-editor-time"
                      type="time"
                      value={formValues.time}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, time: e.target.value }))
                      }
                      className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-2.5 text-[length:var(--fs-small)] text-ws-text tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="event-editor-location"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Location
                  </label>
                  <input
                    id="event-editor-location"
                    type="text"
                    value={formValues.location}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Room, hall, or meeting link"
                    className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-3 text-[length:var(--fs-ui)] text-ws-text"
                  />
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2 text-[length:var(--fs-small)] text-ws-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formValues.isOnline}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, isOnline: e.target.checked }))
                      }
                    />
                    <span>Online meeting</span>
                  </label>
                  <label className="flex items-center gap-2 text-[length:var(--fs-small)] text-ws-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formValues.isExam}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, isExam: e.target.checked }))
                      }
                    />
                    <span>Mark as examination</span>
                  </label>
                </div>
              </>
            }
          />
        </form>
      </LargeEditorDialog>
    </div>
  );
}
