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
  listBrowserEventDraftEntries,
  removeBrowserDraftKey,
  type BrowserEventDraftEntry,
} from '@/client/editor-drafts';
import { ClientApiError } from '@/client/api-client';
import {
  useDeleteEventDraft,
  useEventDrafts,
  usePublishEventDraft,
  useSaveEventDraft,
} from '@/client/queries/event-drafts';
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '@/client/queries/events';
import type { EventCategory, EventItem } from '@/contracts/event';
import type { EventDraftEditorValues, EventDraftRecord } from '@/contracts/event-draft';
import { isValidScheduledDate } from '@/contracts/task';
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
import { extractNotePlainText } from '@/domain/note-format';
import {
  buildZonedInstant,
  DEFAULT_APP_TIMEZONE,
  formatScheduledDate,
  shiftScheduledDate,
} from '@/domain/time';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { cn } from '@/ui/cn';
import { DatePickerField } from '@/ui/DatePickerField';
import { Dialog } from '@/ui/Dialog';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField, type SelectOption } from '@/ui/SelectField';
import { Skeleton } from '@/ui/Skeleton';
import { TimeFieldControl } from '@/ui/TimeFieldControl';
import { useItemAnchor } from '@/ui/use-item-anchor';
import {
  eventEditorPatch,
  eventEditorValues,
  formatZonedTime24,
  isEventDraftPublishable,
  isValidEventTimeHm,
} from './event-editor';
import styles from './events.module.css';

type EventsTab = EventHorizon | 'drafts';

const FALLBACK_TODAY = '2026-11-13';
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const CATEGORY_LABELS: Record<'all' | EventCategory, string> = {
  all: 'All',
  exam: 'Exams',
  school: 'School',
  meeting: 'Meetings',
  deadline: 'Deadlines',
};

const EVENT_CATEGORY_OPTIONS: readonly SelectOption<EventCategory>[] = [
  { value: 'school', label: 'School' },
  { value: 'exam', label: 'Exam' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
];

function defaultEditorValues(
  selectedDate: string | null,
  fallbackDate: string,
): EventDraftEditorValues {
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

function sameEditorValues(a: EventDraftEditorValues, b: EventDraftEditorValues): boolean {
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
  return formatZonedTime24(new Date(iso), DEFAULT_APP_TIMEZONE);
}

function formatZonedDetailDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(new Date(iso));
}

function formatZonedTimeRange(startIso: string, endIso: string | null): string {
  const start = formatZonedTime(startIso);
  if (!endIso) {
    return start;
  }
  return `${start} – ${formatZonedTime(endIso)}`;
}

function formatDraftTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return 'recently';
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DEFAULT_APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
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
  const {
    data: drafts = [],
    isLoading: draftsLoading,
    isError: draftsLoadFailed,
    refetch: refetchDrafts,
  } = useEventDrafts();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const saveDraftMutation = useSaveEventDraft();
  const deleteDraftMutation = useDeleteEventDraft();
  const publishDraftMutation = usePublishEventDraft();

  const savingRef = useRef(false);
  const editorTitleInputRef = useRef<HTMLInputElement>(null);
  const anchoredItemHandledRef = useRef<string | null>(null);
  const initialDateSyncedRef = useRef(false);

  const [todayStr, setTodayStr] = useState(FALLBACK_TODAY);
  const [currentTime, setCurrentTime] = useState('');
  const [agendaNowMs, setAgendaNowMs] = useState(() => Date.parse(`${FALLBACK_TODAY}T00:00:00+07:00`));

  const [horizon, setHorizon] = useState<EventsTab>('upcoming');
  const [activeCategory, setActiveCategory] = useState<'all' | EventCategory>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyFromDateStr(FALLBACK_TODAY));
  const [weekAnchorDate, setWeekAnchorDate] = useState(FALLBACK_TODAY);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [savedEventOverride, setSavedEventOverride] = useState<EventItem | null>(null);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [draftStatusMessage, setDraftStatusMessage] = useState('');

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
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: DEFAULT_APP_TIMEZONE,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        hourCycle: 'h23',
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

  // Editor + persisted server draft state + one-time browser draft import state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EventItem | null>(null);
  const [activeDraft, setActiveDraft] = useState<EventDraftRecord | null>(null);
  const [loadedDraft, setLoadedDraft] = useState<EventDraftRecord | null>(null);
  const [staleConflictPrompt, setStaleConflictPrompt] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<EventDraftEditorValues>(() =>
    defaultEditorValues(null, FALLBACK_TODAY),
  );
  const [formValues, setFormValues] = useState<EventDraftEditorValues>(() =>
    defaultEditorValues(null, FALLBACK_TODAY),
  );
  const [editorError, setEditorError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [browserDrafts, setBrowserDrafts] = useState<BrowserEventDraftEntry[]>([]);
  const [isImportingBrowserDrafts, setIsImportingBrowserDrafts] = useState(false);

  const refreshBrowserDrafts = useCallback(() => {
    setBrowserDrafts(listBrowserEventDraftEntries());
  }, []);

  useEffect(() => {
    refreshBrowserDrafts();
  }, [refreshBrowserDrafts]);

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
        horizon: horizon === 'drafts' ? 'upcoming' : horizon,
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

  const handleSelectHorizon = (next: EventsTab) => {
    setHorizon(next);
    setDraftStatusMessage('');
    if (next === 'upcoming' || next === 'past' || next === 'drafts') {
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
    if (horizon === 'past' || horizon === 'drafts') {
      setHorizon('upcoming');
    }
  };

  const handleClearDayToUpcoming = () => {
    setSelectedDate(null);
    setHorizon('upcoming');
  };

  const openCreateEditor = () => {
    const base = defaultEditorValues(selectedDate, todayStr);
    setEditingRecord(null);
    setActiveDraft(null);
    setLoadedDraft(null);
    setStaleConflictPrompt(false);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setEditorOpen(true);
  };

  const openEditEditor = (evt: EventItem) => {
    const base = eventEditorValues(evt);
    const existingDraft = drafts.find((draft) => draft.sourceEventId === evt.id) ?? null;
    setEditingRecord(evt);
    setActiveDraft(null);
    setLoadedDraft(existingDraft);
    setStaleConflictPrompt(false);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setEditorOpen(true);
  };

  const openDraftEditor = (
    draft: EventDraftRecord,
    options?: { initialError?: string; staleConflict?: boolean },
  ) => {
    const sourceEvent = draft.sourceEventId
      ? (events.find((evt) => evt.id === draft.sourceEventId) ?? null)
      : null;
    setEditingRecord(sourceEvent);
    setActiveDraft(draft);
    setLoadedDraft(null);
    setStaleConflictPrompt(Boolean(options?.staleConflict));
    setInitialFormValues(draft.values);
    setFormValues(draft.values);
    setEditorError(options?.initialError ?? '');
    setEditorOpen(true);
  };

  const handleSaveDraft = async (): Promise<DraftSaveOutcome> => {
    try {
      const result = await saveDraftMutation.mutateAsync({
        id: activeDraft?.id,
        sourceEventId: activeDraft ? activeDraft.sourceEventId : (editingRecord?.id ?? null),
        sourceUpdatedAt: activeDraft
          ? activeDraft.sourceUpdatedAt
          : (editingRecord?.updatedAt ?? null),
        values: formValues,
        importKey: activeDraft?.importKey ?? null,
      });
      setActiveDraft(result.item);
      setLoadedDraft(null);
      setStaleConflictPrompt(false);
      setInitialFormValues(formValues);
      return {
        ok: true,
        message: `Draft saved (${formatDraftTimestamp(result.item.updatedAt)}).`,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not save this draft right now. Your input is retained.',
      };
    }
  };

  const executeEditorSubmit = async (forceOverwrite = false) => {
    if (savingRef.current) {
      return;
    }
    const trimmedTitle = formValues.title.trim();
    if (!trimmedTitle) {
      setEditorError('Enter an event title.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (trimmedTitle.length > 200) {
      setEditorError('Title must be 200 characters or fewer.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (!isValidScheduledDate(formValues.date.trim())) {
      setEditorError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }
    if (!isValidEventTimeHm(formValues.time)) {
      setEditorError('Enter a valid 24-hour time in HH:mm format.');
      return;
    }

    savingRef.current = true;
    setIsSubmitting(true);
    setEditorError('');
    setActionError('');
    setDraftStatusMessage('');

    try {
      if (activeDraft) {
        if (!sameEditorValues(activeDraft.values, formValues)) {
          const savedDraft = await saveDraftMutation.mutateAsync({
            id: activeDraft.id,
            sourceEventId: activeDraft.sourceEventId,
            sourceUpdatedAt: activeDraft.sourceUpdatedAt,
            values: formValues,
            importKey: activeDraft.importKey,
          });
          setActiveDraft(savedDraft.item);
        }
        const published = await publishDraftMutation.mutateAsync({
          id: activeDraft.id,
          forceOverwrite,
        });
        setSavedEventOverride(published.event);
        setSelectedEventId(published.event.id);
      } else if (editingRecord) {
        const patch = eventEditorPatch(editingRecord, formValues);
        const saved = await updateMutation.mutateAsync({
          id: editingRecord.id,
          patch,
        });
        if (loadedDraft) {
          await deleteDraftMutation.mutateAsync(loadedDraft.id).catch(() => {});
        }
        setSavedEventOverride(saved);
        setSelectedEventId(saved.id);
      } else {
        const created = await createMutation.mutateAsync({
          title: trimmedTitle,
          description: null,
          category: formValues.category,
          startAt: buildZonedInstant(formValues.date.trim(), formValues.time.trim()),
          endAt: null,
          locationType: formValues.isOnline ? 'online' : 'in_person',
          location: formValues.location.trim() || null,
          url: null,
          isExam: formValues.isExam || formValues.category === 'exam',
          notes: formValues.notes.trim() || null,
        });
        setSavedEventOverride(created);
        setSelectedEventId(created.id);
      }
      setActiveDraft(null);
      setLoadedDraft(null);
      setStaleConflictPrompt(false);
      setEditorOpen(false);
      setEditingRecord(null);
    } catch (error) {
      if (error instanceof ClientApiError && error.code === 'CONFLICT') {
        setStaleConflictPrompt(true);
      }
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

  const handleEditorSubmit = (e: FormEvent) => {
    e.preventDefault();
    void executeEditorSubmit(false);
  };

  const handleDeleteEvent = (evt: EventItem) => {
    setActionError('');
    setDraftStatusMessage('');
    deleteMutation.mutate(evt.id, {
      onSuccess: () => {
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

  const handleDeleteDraft = async (draft: EventDraftRecord) => {
    setActionError('');
    setDraftStatusMessage('');
    try {
      await deleteDraftMutation.mutateAsync(draft.id);
      setDraftStatusMessage('Draft deleted.');
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Could not delete this draft right now. Retry when ready.',
      );
    }
  };

  const handlePublishDraft = async (draft: EventDraftRecord) => {
    setActionError('');
    setDraftStatusMessage('');
    if (!isEventDraftPublishable(draft.values)) {
      openDraftEditor(draft, {
        initialError:
          'Complete title, date (YYYY-MM-DD), and 24-hour time (HH:mm) before adding to schedule.',
      });
      return;
    }

    try {
      const published = await publishDraftMutation.mutateAsync({ id: draft.id });
      setSavedEventOverride(published.event);
      setSelectedEventId(published.event.id);
      setHorizon(Date.parse(published.event.startAt) < agendaNowMs ? 'past' : 'upcoming');
      setDraftStatusMessage(
        published.mode === 'update' ? 'Changes applied to schedule.' : 'Event added to schedule.',
      );
    } catch (error) {
      if (error instanceof ClientApiError && error.code === 'CONFLICT') {
        openDraftEditor(draft, {
          initialError: error.message,
          staleConflict: true,
        });
        return;
      }
      setActionError(
        error instanceof Error
          ? error.message
          : 'Could not publish this draft right now. Retry when ready.',
      );
    }
  };

  const handleImportBrowserDrafts = async () => {
    if (isImportingBrowserDrafts || browserDrafts.length === 0) {
      return;
    }
    setIsImportingBrowserDrafts(true);
    setActionError('');
    setDraftStatusMessage('');

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
      setDraftStatusMessage(
        imported === 1 ? 'Imported 1 browser draft.' : `Imported ${imported} browser drafts.`,
      );
    }
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
        {evt.description && evt.description !== evt.notes ? (
          <p className="text-[length:var(--fs-ui)] text-ws-text-muted [overflow-wrap:anywhere]">
            {evt.description}
          </p>
        ) : null}
      </div>

      <dl className="space-y-2.5 border-y border-ws-border py-3.5 text-[length:var(--fs-small)]">
        <div className={styles.detailScheduleList}>
          <div className={styles.detailScheduleRow}>
            <dt className="inline-flex items-center gap-1.5 text-ws-text-muted">
              <CalendarIcon size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />
              <span>Date</span>
            </dt>
            <dd className="font-medium text-ws-text tabular-nums text-right">
              {formatZonedDetailDate(evt.startAt)}
            </dd>
          </div>
          <div className={styles.detailScheduleRow}>
            <dt className="inline-flex items-center gap-1.5 text-ws-text-muted">
              <Clock size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />
              <span>Time</span>
            </dt>
            <dd className="font-medium text-ws-text tabular-nums text-right">
              {formatZonedTimeRange(evt.startAt, evt.endAt)} · Saigon
            </dd>
          </div>
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
          <FormattedNoteContent
            value={evt.notes}
            className="text-[length:var(--fs-small)] leading-relaxed text-ws-text-muted [overflow-wrap:anywhere]"
          />
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

      {draftStatusMessage ? (
        <div
          role="status"
          className="rounded-card border border-ws-border bg-ws-accent-soft px-4 py-3 text-[length:var(--fs-small)] text-ws-text"
        >
          {draftStatusMessage}
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
              className="inline-flex flex-wrap items-center gap-0.5 sm:gap-1 rounded-pill bg-ws-accent-soft p-1 border border-ws-border self-start max-w-full"
            >
              {(['upcoming', 'past', 'week', 'drafts'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={horizon === tab}
                  onClick={() => handleSelectHorizon(tab)}
                  className={cn(
                    'min-h-9 whitespace-nowrap rounded-pill px-2.5 min-[375px]:px-3 sm:px-3.5 py-1.5 text-[0.75rem] min-[375px]:text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-fast)]',
                    horizon === tab
                      ? 'bg-ws-surface text-ws-text shadow-card'
                      : 'text-ws-text-muted hover:text-ws-text',
                  )}
                >
                  {tab === 'upcoming' ? (
                    'Upcoming'
                  ) : tab === 'past' ? (
                    'Past'
                  ) : tab === 'week' ? (
                    'Week calendar'
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

            {horizon !== 'drafts' ? (
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
            ) : null}
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

          {horizon === 'drafts' ? (
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
                        Import them into saved server drafts. Any draft that fails to import stays stored locally.
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

              {draftsLoadFailed ? (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-small)] text-text-overdue"
                >
                  <span>Could not load saved drafts right now.</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RotateCcw size={14} aria-hidden="true" />}
                    onClick={() => void refetchDrafts()}
                  >
                    Retry
                  </Button>
                </div>
              ) : null}

              {draftsLoading && drafts.length === 0 ? (
                <div className="space-y-3" aria-label="Loading drafts">
                  <Skeleton className="h-24 w-full rounded-item" />
                  <Skeleton className="h-24 w-full rounded-item" />
                </div>
              ) : drafts.length === 0 ? (
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
                  <h2 className="font-display text-[1.5rem] text-ws-text">No saved drafts yet.</h2>
                  <p className="max-w-md text-[length:var(--fs-ui)] text-ws-text-muted">
                    Save an unfinished event or edit while drafting and it will stay waiting here without cluttering your calendar.
                  </p>
                  <Button variant="primary" size="sm" onClick={openCreateEditor}>
                    New event
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3" aria-label="Saved event drafts">
                  {drafts.map((draft) => {
                    const sourceEvent = draft.sourceEventId
                      ? (events.find((evt) => evt.id === draft.sourceEventId) ?? null)
                      : null;
                    const isEditDraft = draft.sourceEventId !== null;
                    const isMissingSource = isEditDraft && !isLoading && !loadFailed && !sourceEvent;
                    const isStale = Boolean(
                      isEditDraft &&
                        sourceEvent &&
                        draft.sourceUpdatedAt &&
                        sourceEvent.updatedAt !== draft.sourceUpdatedAt,
                    );
                    const draftTitle = draft.values.title.trim() || 'Untitled event';
                    const draftNotesPreview = draft.values.notes
                      ? extractNotePlainText(draft.values.notes)
                      : '';
                    const publishable = isEventDraftPublishable(draft.values);

                    return (
                      <li key={draft.id} className={styles.draftCard}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <CategoryBadge
                              category={draft.values.category}
                              isExam={draft.values.isExam}
                            />
                            <span className="inline-flex items-center rounded-pill border border-ws-border bg-ws-surface px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
                              {isEditDraft ? 'Edit draft' : 'New event draft'}
                            </span>
                            {isStale ? (
                              <span className="inline-flex items-center gap-1 rounded-pill border border-tint-due-soon-border bg-tint-due-soon-bg px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium text-text-due-soon">
                                <AlertTriangle size={12} aria-hidden="true" />
                                <span>Stale — source changed</span>
                              </span>
                            ) : null}
                            {isMissingSource ? (
                              <span className="inline-flex items-center gap-1 rounded-pill border border-tint-overdue-border bg-tint-overdue-bg px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium text-text-overdue">
                                <AlertTriangle size={12} aria-hidden="true" />
                                <span>Original event missing</span>
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                            Saved {formatDraftTimestamp(draft.updatedAt)}
                          </span>
                        </div>

                        <h3 className="font-display text-[1.3rem] leading-snug text-ws-text [overflow-wrap:anywhere]">
                          {draftTitle}
                        </h3>

                        {sourceEvent ? (
                          <p className="mt-1 text-[length:var(--fs-micro)] text-ws-text-muted">
                            Editing: {sourceEvent.title}
                          </p>
                        ) : null}

                        {draftNotesPreview ? (
                          <p className="mt-1.5 text-[length:var(--fs-small)] text-ws-text-muted line-clamp-2 [overflow-wrap:anywhere]">
                            {draftNotesPreview}
                          </p>
                        ) : null}

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
                          <span>
                            {draft.values.date || 'No date'} · {draft.values.time || 'No time'}
                          </span>
                          {draft.values.location.trim() ? (
                            <span className="truncate">{draft.values.location.trim()}</span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ws-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-text-overdue hover:bg-tint-overdue-bg"
                            onClick={() => void handleDeleteDraft(draft)}
                          >
                            Delete
                          </Button>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openDraftEditor(draft)}
                            >
                              Resume
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={publishDraftMutation.isPending}
                              onClick={() => {
                                if (publishable) {
                                  void handlePublishDraft(draft);
                                } else {
                                  openDraftEditor(draft, {
                                    initialError:
                                      'Complete title, date (YYYY-MM-DD), and 24-hour time (HH:mm) before adding to schedule.',
                                  });
                                }
                              }}
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
          ) : isLoading && events.length === 0 ? (
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
            <ul
              className={cn(
                'space-y-3',
                horizon === 'past' &&
                  !selectedDate &&
                  visibleAgendaEvents.length > 3 &&
                  styles.pastEventsScroller,
              )}
              aria-label="Events agenda"
            >
              {visibleAgendaEvents.map((evt) => {
                const isSelected = selectedEventId === evt.id;
                const eventDay = formatScheduledDate(evt.startAt, DEFAULT_APP_TIMEZONE);
                const notesPreview = evt.notes ? extractNotePlainText(evt.notes) : '';
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

                      {notesPreview ? (
                        <p className="mt-1.5 text-[length:var(--fs-small)] text-ws-text-muted line-clamp-2 [overflow-wrap:anywhere]">
                          {notesPreview}
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

      {/* Shared Centered Two-Column Event Editor + Persisted Server Drafts */}
      {(() => {
        const isEditingMode = Boolean(editingRecord || activeDraft?.sourceEventId);
        const isActiveDraftMissingSource = Boolean(
          activeDraft?.sourceEventId && !editingRecord && !isLoading && !loadFailed,
        );
        const isActiveDraftStale = Boolean(
          activeDraft?.sourceEventId &&
            editingRecord &&
            activeDraft.sourceUpdatedAt &&
            activeDraft.sourceUpdatedAt !== editingRecord.updatedAt,
        );

        return (
          <LargeEditorDialog
            open={editorOpen}
            onClose={() => {
              setEditorOpen(false);
              setEditingRecord(null);
              setActiveDraft(null);
              setLoadedDraft(null);
              setStaleConflictPrompt(false);
              setEditorError('');
            }}
            title={
              isEditingMode ? 'Edit event' : activeDraft ? 'Resume event draft' : 'New event'
            }
            description="Dates and times use the 24-hour Asia/Saigon schedule."
            formId="event-large-editor-form"
            isDirty={isEditorDirty}
            isSubmitting={isSubmitting}
            submitLabel={isEditingMode ? 'Apply changes' : 'Add to schedule'}
            submittingLabel={isEditingMode ? 'Applying…' : 'Adding…'}
            closeAriaLabel="Close event editor"
            initialFocusRef={editorTitleInputRef}
            errorMessage={editorError}
            footerActions={
              staleConflictPrompt && activeDraft ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void executeEditorSubmit(true)}
                >
                  Overwrite and apply
                </Button>
              ) : null
            }
            draftRecovery={
              loadedDraft
                ? {
                    savedAtLabel: formatDraftTimestamp(loadedDraft.updatedAt),
                    stale: Boolean(
                      editingRecord &&
                        loadedDraft.sourceUpdatedAt &&
                        loadedDraft.sourceUpdatedAt !== editingRecord.updatedAt,
                    ),
                    staleMessage:
                      'This event changed on disk after your draft was saved. Review changes carefully before applying.',
                    onResume: () => {
                      setActiveDraft(loadedDraft);
                      setFormValues(loadedDraft.values);
                      setInitialFormValues(loadedDraft.values);
                      setLoadedDraft(null);
                    },
                    onDiscard: () => {
                      const idToDelete = loadedDraft.id;
                      setLoadedDraft(null);
                      void deleteDraftMutation.mutateAsync(idToDelete).catch(() => {});
                    },
                  }
                : null
            }
            onSaveDraft={handleSaveDraft}
          >
            <form id="event-large-editor-form" onSubmit={handleEditorSubmit} className="space-y-4">
              {isActiveDraftStale && !staleConflictPrompt ? (
                <div
                  role="status"
                  className="rounded-item border border-tint-due-soon-border bg-tint-due-soon-bg px-3.5 py-2.5 text-[length:var(--fs-small)] text-text-due-soon"
                >
                  This event changed on the server after this draft was saved. Review your changes before applying.
                </div>
              ) : null}

              {isActiveDraftMissingSource ? (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3.5 py-2.5 text-[length:var(--fs-small)] text-text-overdue"
                >
                  <span>The original event for this edit draft was deleted.</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (!activeDraft) return;
                      const oldId = activeDraft.id;
                      void saveDraftMutation
                        .mutateAsync({
                          sourceEventId: null,
                          sourceUpdatedAt: null,
                          values: formValues,
                        })
                        .then(async (saved) => {
                          await deleteDraftMutation.mutateAsync(oldId).catch(() => {});
                          setActiveDraft(saved.item);
                          setEditingRecord(null);
                          setEditorError('');
                        })
                        .catch((err) => {
                          setEditorError(
                            err instanceof Error ? err.message : 'Could not convert draft.',
                          );
                        });
                    }}
                  >
                    Save as new draft
                  </Button>
                </div>
              ) : null}

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
                        id="event-editor-notes-label"
                        htmlFor="event-editor-notes"
                        className="text-[length:var(--fs-small)] font-medium text-ws-text"
                      >
                        Notes &amp; instructions
                      </label>
                      <RichNoteEditor
                        id="event-editor-notes"
                        ariaLabelledBy="event-editor-notes-label"
                        value={formValues.notes}
                        onChange={(notes) => setFormValues((prev) => ({ ...prev, notes }))}
                        placeholder="Preparation steps, room details, materials, or talking points…"
                      />
                    </div>
                  </>
                }
                metadata={
                  <>
                    <SelectField<EventCategory>
                      id="event-editor-category"
                      label="Category"
                      value={formValues.category}
                      onChange={(category) => setFormValues((prev) => ({ ...prev, category }))}
                      options={EVENT_CATEGORY_OPTIONS}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <DatePickerField
                        id="event-editor-date"
                        label="Date"
                        mode="iso"
                        value={formValues.date}
                        onChange={(date) => {
                          setFormValues((prev) => ({ ...prev, date }));
                          if (editorError) setEditorError('');
                        }}
                        error={Boolean(editorError && !isValidScheduledDate(formValues.date.trim()))}
                      />
                      <TimeFieldControl
                        id="event-editor-time"
                        label="Time"
                        value={formValues.time}
                        onChange={(time) => {
                          setFormValues((prev) => ({ ...prev, time }));
                          if (editorError) setEditorError('');
                        }}
                        placeholder="HH:mm"
                        error={Boolean(editorError && !isValidEventTimeHm(formValues.time))}
                      />
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

                    <div className="space-y-1 pt-1">
                      <Checkbox
                        id="event-editor-online"
                        checked={formValues.isOnline}
                        onCheckedChange={(isOnline) =>
                          setFormValues((prev) => ({ ...prev, isOnline }))
                        }
                        label="Online meeting"
                      />
                      <Checkbox
                        id="event-editor-exam"
                        checked={formValues.isExam}
                        onCheckedChange={(isExam) => setFormValues((prev) => ({ ...prev, isExam }))}
                        label="Mark as examination"
                      />
                    </div>
                  </>
                }
              />
            </form>
          </LargeEditorDialog>
        );
      })()}
    </div>
  );
}
