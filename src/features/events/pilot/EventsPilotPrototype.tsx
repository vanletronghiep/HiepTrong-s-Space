'use client';

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Command,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { eventItemSchema, type EventCategory, type EventItem } from '@/contracts/event';
import { computeEventStats, formatRelativeEventTime, getUpcomingExams } from '@/domain/event-domain';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import {
  blankEditorValues,
  eventEditorPatch,
  eventEditorValues,
} from '@/features/events/event-editor';

type EventEditorValues = ReturnType<typeof eventEditorValues>;
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { StarIcon } from '@/ui/StarIcon';
import { useFocusTrap } from '@/ui/use-focus-trap';
import {
  LONG_CONTENT_PILOT_EVENTS,
  PILOT_NOW,
  POPULATED_PILOT_EVENTS,
  type PilotDatasetMode,
} from './events-pilot-fixtures';
import styles from './events-pilot.module.css';

type HorizonMode = 'upcoming' | 'past' | 'week';

interface PilotDraft {
  formKey: string;
  eventId: string | null;
  savedAtLabel: string;
  values: EventEditorValues;
}

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const CATEGORY_LABELS: Record<'all' | EventCategory, string> = {
  all: 'All',
  exam: 'Exams',
  school: 'School',
  meeting: 'Meetings',
  deadline: 'Deadlines',
  contest: 'Contests',
};

const DATASET_LABELS: Record<PilotDatasetMode, string> = {
  populated: 'Populated',
  empty: 'Empty',
  long: 'Long content',
  error: 'Error',
};

const pad2 = (n: number) => String(n).padStart(2, '0');

function monthKeyFromDateStr(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const target = new Date(Date.UTC(y ?? 2026, (m ?? 11) - 1 + deltaMonths, 1));
  return `${target.getUTCFullYear()}-${pad2(target.getUTCMonth() + 1)}`;
}

function formatMonthTitle(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y ?? 2026, (m ?? 11) - 1, 15));
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

function getMonthGridDays(monthKey: string): Array<{ dateStr: string; inMonth: boolean; dayNum: number }> {
  const firstDay = `${monthKey}-01`;
  const weekday = new Date(`${firstDay}T12:00:00Z`).getUTCDay();
  const mondayOffset = -((weekday + 6) % 7);
  const startStr = shiftScheduledDate(firstDay, mondayOffset);

  return Array.from({ length: 42 }, (_, idx) => {
    const dateStr = shiftScheduledDate(startStr, idx);
    return {
      dateStr,
      inMonth: dateStr.slice(0, 7) === monthKey,
      dayNum: Number(dateStr.slice(8, 10)),
    };
  });
}

function getWeekDaysForAnchor(anchorDateStr: string): string[] {
  const weekday = new Date(`${anchorDateStr}T12:00:00Z`).getUTCDay();
  const monday = shiftScheduledDate(anchorDateStr, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftScheduledDate(monday, i));
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

function defaultEditorValues(selectedDate: string | null): EventEditorValues {
  return blankEditorValues(selectedDate ?? '2026-11-15', { category: 'school' });
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

export function EventsPilotPrototype() {
  const todayStr = useMemo(() => formatScheduledDate(PILOT_NOW, DEFAULT_APP_TIMEZONE), []);
  const [datasetMode, setDatasetMode] = useState<PilotDatasetMode>('populated');
  const [eventsState, setEventsState] = useState<EventItem[]>(() => POPULATED_PILOT_EVENTS);

  const [horizon, setHorizon] = useState<HorizonMode>('upcoming');
  const [activeCategory, setActiveCategory] = useState<'all' | EventCategory>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string>(() => monthKeyFromDateStr(todayStr));
  const [weekAnchorDate, setWeekAnchorDate] = useState<string>(todayStr);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);

  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Theme-propagation preview overlays in the prototype topbar (fixture-only)
  const [universePreviewOpen, setUniversePreviewOpen] = useState(false);
  const [bellPreviewOpen, setBellPreviewOpen] = useState(false);

  // Fixture-only Large Editor + Local Draft state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EventItem | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<EventEditorValues>(() =>
    defaultEditorValues(null),
  );
  const [formValues, setFormValues] = useState<EventEditorValues>(() => defaultEditorValues(null));
  const [editorError, setEditorError] = useState('');
  const [dirtyPromptOpen, setDirtyPromptOpen] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<Record<string, PilotDraft>>({});
  const [draftNotice, setDraftNotice] = useState('');

  const editorPanelRef = useRef<HTMLDivElement>(null);
  const editorTitleInputRef = useRef<HTMLInputElement>(null);
  const editorHeadingId = useId();

  const applyDatasetMode = (nextMode: PilotDatasetMode) => {
    setDatasetMode(nextMode);
    setSelectedDate(null);
    setSelectedEventId(null);
    setCalendarMonth(monthKeyFromDateStr(todayStr));
    setWeekAnchorDate(todayStr);
    if (nextMode === 'populated') {
      setEventsState(POPULATED_PILOT_EVENTS);
    } else if (nextMode === 'empty') {
      setEventsState([]);
    } else if (nextMode === 'long') {
      setEventsState(LONG_CONTENT_PILOT_EVENTS);
    } else {
      setEventsState(POPULATED_PILOT_EVENTS);
    }
  };

  const events = useMemo(() => (datasetMode === 'error' ? [] : eventsState), [datasetMode, eventsState]);
  const stats = useMemo(() => computeEventStats(events, PILOT_NOW), [events]);
  const upcomingExams = useMemo(() => getUpcomingExams(events, PILOT_NOW), [events]);

  const categoryMatchedEvents = useMemo(
    () =>
      events.filter(
        (evt) =>
          activeCategory === 'all' ||
          evt.category === activeCategory ||
          (activeCategory === 'exam' && evt.isExam),
      ),
    [events, activeCategory],
  );

  const visibleAgendaEvents = useMemo(() => {
    const nowMs = PILOT_NOW.getTime();
    if (selectedDate) {
      return categoryMatchedEvents
        .filter((evt) => formatScheduledDate(evt.startAt, DEFAULT_APP_TIMEZONE) === selectedDate)
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
    }
    if (horizon === 'past') {
      return categoryMatchedEvents
        .filter((evt) => Date.parse(evt.startAt) < nowMs)
        .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
    }
    return categoryMatchedEvents
      .filter((evt) => Date.parse(evt.startAt) >= nowMs)
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  }, [categoryMatchedEvents, horizon, selectedDate]);

  // Day indicator index across all events in active dataset (category-independent so days remain discoverable)
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

  const selectedEvent = useMemo(
    () => events.find((evt) => evt.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const handleSelectHorizon = (next: HorizonMode) => {
    setHorizon(next);
    if (next === 'upcoming') {
      setSelectedDate(null);
    } else if (next === 'past') {
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

  const activeDraftKey = editingRecord ? `edit:${editingRecord.id}` : 'create:new';
  const availableDraft = editorOpen ? savedDrafts[activeDraftKey] ?? null : null;
  const isEditorDirty = editorOpen && !sameEditorValues(initialFormValues, formValues);

  const openCreateEditor = () => {
    const base = defaultEditorValues(selectedDate);
    setEditingRecord(null);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setDraftNotice('');
    setDirtyPromptOpen(false);
    setEditorOpen(true);
  };

  const openEditEditor = (evt: EventItem) => {
    const base = eventEditorValues(evt);
    setEditingRecord(evt);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setDraftNotice('');
    setDirtyPromptOpen(false);
    setEditorOpen(true);
  };

  const requestCloseEditor = () => {
    if (dirtyPromptOpen) {
      setDirtyPromptOpen(false);
      return;
    }
    if (isEditorDirty) {
      setDirtyPromptOpen(true);
      return;
    }
    setEditorOpen(false);
  };

  const saveFixtureDraftAndClose = () => {
    const nowLabel = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: DEFAULT_APP_TIMEZONE,
    }).format(PILOT_NOW);
    setSavedDrafts((prev) => ({
      ...prev,
      [activeDraftKey]: {
        formKey: activeDraftKey,
        eventId: editingRecord?.id ?? null,
        savedAtLabel: `${nowLabel} local`,
        values: formValues,
      },
    }));
    setDirtyPromptOpen(false);
    setEditorOpen(false);
  };

  const handleSaveExplicitDraft = () => {
    const nowLabel = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: DEFAULT_APP_TIMEZONE,
    }).format(PILOT_NOW);
    setSavedDrafts((prev) => ({
      ...prev,
      [activeDraftKey]: {
        formKey: activeDraftKey,
        eventId: editingRecord?.id ?? null,
        savedAtLabel: `${nowLabel} local`,
        values: formValues,
      },
    }));
    setInitialFormValues(formValues);
    setDraftNotice(`Draft saved locally at ${nowLabel} (fixture preview).`);
  };

  const discardEditorChanges = () => {
    setDirtyPromptOpen(false);
    setEditorOpen(false);
  };

  const handleEditorSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formValues.title.trim() || !formValues.date) {
      setEditorError('Enter an event title and date.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (datasetMode === 'error') {
      setEditorError('Simulated save failure: entered input and any saved draft stay intact.');
      return;
    }

    if (editingRecord) {
      const patch = eventEditorPatch(editingRecord, formValues);
      const updated: EventItem = {
        ...editingRecord,
        ...patch,
        updatedAt: PILOT_NOW.toISOString(),
      };
      setEventsState((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedEventId(updated.id);
    } else {
      const created: EventItem = eventItemSchema.parse({
        id: `evt-pilot-${Date.now()}`,
        title: formValues.title.trim(),
        description: formValues.notes.trim() || null,
        category: formValues.category,
        startAt: buildZonedInstant(formValues.date, formValues.time || '09:00'),
        endAt: null,
        locationType: formValues.isOnline ? 'online' : 'in_person',
        location: formValues.location.trim() || null,
        url: null,
        isExam: formValues.isExam || formValues.category === 'exam',
        preparationTaskId: null,
        recurrence: null,
        notes: formValues.notes.trim() || null,
        createdAt: PILOT_NOW.toISOString(),
        updatedAt: PILOT_NOW.toISOString(),
      });
      setEventsState((prev) => [created, ...prev]);
      setSelectedEventId(created.id);
    }

    setSavedDrafts((prev) => {
      const copy = { ...prev };
      delete copy[activeDraftKey];
      return copy;
    });
    setEditorOpen(false);
  };

  useFocusTrap({
    open: editorOpen && !dirtyPromptOpen,
    containerRef: editorPanelRef,
    initialFocusRef: editorTitleInputRef,
    onClose: requestCloseEditor,
  });

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
            Select a day to filter agenda & week
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCalendarMonth((m) => shiftMonthKey(m, -1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-ws-border bg-ws-surface text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            <ChevronLeft size={16} strokeWidth={1.6} />
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
            <ChevronRight size={16} strokeWidth={1.6} />
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
                  !cell.inMonth && styles.calendarCellMuted,
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
                    {formatRelativeEventTime(exam.startAt, PILOT_NOW)}
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
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={evt.category ?? 'school'} isExam={evt.isExam} />
            <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
              {formatRelativeEventTime(evt.startAt, PILOT_NOW)}
            </span>
          </div>
          {inModal ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close event details"
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer transition-colors duration-[var(--dur-fast)]"
            >
              <X size={16} />
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
            <dd>Linked preparation task preserved on edits ({evt.preparationTaskId})</dd>
          </div>
        ) : null}
      </dl>

      {evt.notes ? (
        <div className="space-y-1.5">
          <h3 className="text-[length:var(--fs-small)] font-medium text-ws-text">
            Notes & instructions
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
          onClick={() => {
            setEventsState((prev) => prev.filter((item) => item.id !== evt.id));
            setSelectedEventId(null);
          }}
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
    <div data-theme="workspace" data-feature-theme="events" className={styles.pageShell}>
      {/* Left vertical kelp shore on wide desktop gutters */}
      <Image
        src="/preview/events-pilot/kelp-ribbon-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.kelpEdgeDecor}
      />

      {/* Full-viewport Events Topbar inheriting Events Aquatic Blue palette */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <TransitionLink
            href="/"
            aria-label="Hiep Trong Space home"
            className="inline-flex items-center gap-1.5 rounded-pill px-2 py-1 -ml-2 text-ws-text hover:opacity-80 transition-opacity duration-[var(--dur-fast)]"
          >
            <span className="font-display italic text-[1.375rem] leading-none">Hiep Trong</span>
            <StarIcon size={10} className="text-ws-accent" />
          </TransitionLink>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBellPreviewOpen(false);
                setUniversePreviewOpen(true);
              }}
              aria-label="Preview Universe menu inheriting events theme"
              className="inline-flex items-center gap-2 min-h-[36px] px-3.5 rounded-pill bg-ws-accent-soft text-ws-text border border-ws-border text-[length:var(--fs-small)] font-medium whitespace-nowrap cursor-pointer hover:bg-ws-surface transition-colors duration-[var(--dur-fast)]"
            >
              <Command size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>Universe</span>
              <span
                aria-hidden="true"
                className="hidden md:inline-block ml-0.5 text-[length:var(--fs-micro)] text-ws-text-muted"
              >
                Ctrl K
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUniversePreviewOpen(false);
                setBellPreviewOpen((v) => !v);
              }}
              aria-label="Preview Sakura Notifications over events page"
              aria-expanded={bellPreviewOpen}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-pill text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
            >
              <Bell size={19} strokeWidth={1.5} aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 h-2 w-2 rounded-pill bg-status-overdue ring-2 ring-ws-bg"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Isolated Prototype Mode Switcher Bar (never reads/writes live DB or production nav) */}
      <div className={styles.pilotBar} role="region" aria-label="Prototype state controls">
        <div className={styles.pilotBarInner}>
          <div className="flex items-center gap-2 text-[length:var(--fs-micro)] text-ws-text-muted">
            <Sparkles size={13} className="text-ws-accent shrink-0" aria-hidden="true" />
            <span>Epic 02 Aquatic Agenda pilot · Fixture data only</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Fixture states">
            {(['populated', 'empty', 'long', 'error'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={datasetMode === mode}
                onClick={() => applyDatasetMode(mode)}
                className={cn(
                  'rounded-pill px-2.5 py-1 text-[length:var(--fs-micro)] font-medium border cursor-pointer transition-colors duration-[var(--dur-instant)]',
                  datasetMode === mode
                    ? 'bg-ws-accent text-ws-surface border-ws-accent'
                    : 'bg-ws-surface text-ws-text border-ws-border hover:bg-ws-accent-soft',
                )}
              >
                {DATASET_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main id="main-content" tabIndex={-1} className={styles.mainCanvas}>
        {/* Editorial Underwater Masthead */}
        <section className={styles.masthead} aria-labelledby="events-pilot-heading">
          <Image
            src="/preview/events-pilot/manta-in-the-current.svg"
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
              <span>Schedule & milestones</span>
            </div>
            <h1 id="events-pilot-heading" className={styles.displayTitle}>
              Events <span className={styles.displayTitleEmphasis}>&amp; exams</span>
            </h1>
            <p className="mt-3 text-[length:var(--fs-ui)] text-ws-text-muted tabular-nums">
              {stats.upcomingCount} upcoming · {stats.thisWeekCount} this week ·{' '}
              {stats.approachingExamsCount} approaching{' '}
              {stats.approachingExamsCount === 1 ? 'exam' : 'exams'}
            </p>
          </div>

          <div className="relative z-1 flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-pill border border-ws-border bg-ws-surface px-3.5 py-2 text-[length:var(--fs-small)] text-ws-text tabular-nums">
              <Clock size={14} className="text-ws-accent shrink-0" aria-hidden="true" />
              <span>Fri, Nov 13 · 12:50</span>
            </div>
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

        {/* Simulated Load Error Banner */}
        {datasetMode === 'error' && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
          >
            <span>Could not load your schedule right now. Check connection or retry loading fixtures.</span>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} aria-hidden="true" />}
              onClick={() => applyDatasetMode('populated')}
            >
              Retry
            </Button>
          </div>
        )}

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
                  {selectedDate ? `Filtered: ${formatShortDay(selectedDate)}` : formatMonthTitle(calendarMonth)}
                </span>
                <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
                  Month calendar & exam highlights
                </span>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-ws-accent-soft text-ws-text">
                {mobileCalendarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {mobileCalendarOpen ? <div className="mt-4 border-t border-ws-border pt-4">{renderCalendarContent()}</div> : null}
          </div>
        </div>

        {/* Coordinated Agenda + Calendar/Detail Two-Zone Workspace */}
        <section className={styles.workspaceGrid} aria-label="Agenda and calendar">
          {/* Primary Reading Area: Agenda or Coordinated Week Schedule */}
          <div className={styles.agendaSurface}>
            <div className={cn(styles.controlsBand, 'pb-4 mb-4 border-b border-ws-border')}>
              {/* Horizon Tabs */}
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

              {/* Category Filters */}
              <div
                role="tablist"
                aria-label="Category filter"
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

            {/* Active Date Filter Chip */}
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

            {/* Week Calendar Mode vs Agenda Stream */}
            {horizon === 'week' ? (
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
                      .filter((evt) => formatScheduledDate(evt.startAt, DEFAULT_APP_TIMEZONE) === dateStr)
                      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
                    const isActive = selectedDate === dateStr || (!selectedDate && todayStr === dateStr);
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
                  src="/preview/events-pilot/hermit-shell-haven.svg"
                  alt=""
                  aria-hidden="true"
                  width={320}
                  height={280}
                  loading="eager"
                  unoptimized
                  className={styles.emptyShellArt}
                />
                <h2 className="font-display text-[1.5rem] text-ws-text">
                  {datasetMode === 'error' ? 'Schedule unavailable in preview.' : agendaEmptyTitle}
                </h2>
                <p className="max-w-md text-[length:var(--fs-ui)] text-ws-text-muted">
                  {datasetMode === 'error'
                    ? 'The fixture source simulated a failed fetch. Retry loading or inspect offline fallback behavior.'
                    : selectedDate
                      ? 'Switch back to Upcoming to see your full horizon, or add an event on this date.'
                      : 'Your harbor is quiet for now. Add an exam, class milestone, or meeting when ready.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {datasetMode === 'error' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<RotateCcw size={14} aria-hidden="true" />}
                      onClick={() => applyDatasetMode('populated')}
                    >
                      Retry loading fixtures
                    </Button>
                  ) : (
                    <>
                      {selectedDate ? (
                        <Button variant="secondary" size="sm" onClick={handleClearDayToUpcoming}>
                          Upcoming (show all)
                        </Button>
                      ) : null}
                      <Button variant="primary" size="sm" onClick={openCreateEditor}>
                        Add event
                      </Button>
                    </>
                  )}
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
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedEventId(isSelected && isDesktop ? null : evt.id)}
                        className={cn(styles.eventRow, isSelected && styles.eventRowSelected)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <CategoryBadge category={evt.category ?? 'school'} isExam={evt.isExam} />
                          <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
                            {formatRelativeEventTime(evt.startAt, PILOT_NOW)}
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
                            <CalendarIcon size={14} className="text-ws-accent shrink-0" aria-hidden="true" />
                            <span>
                              {formatShortDay(eventDay)} · {formatZonedTime(evt.startAt)}
                            </span>
                          </span>
                          {evt.location ? (
                            <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                              {evt.locationType === 'online' ? (
                                <Video size={14} className="text-ws-accent shrink-0" aria-hidden="true" />
                              ) : (
                                <MapPin size={14} className="text-ws-accent shrink-0" aria-hidden="true" />
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

          {/* Supporting Desktop/Tablet Pane: Swaps cleanly between Calendar+Exams and Selected Event Detail */}
          <aside className={styles.supportColumn} aria-label="Supporting calendar and details">
            <div className={styles.supportSurface}>
              {selectedEvent
                ? renderDetailContent(selectedEvent, () => setSelectedEventId(null))
                : renderCalendarContent()}
            </div>
            <Image
              src="/preview/events-pilot/coral-garden.svg"
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

        {/* Quiet shoreline wave divider + mobile bottom reef accent */}
        <div className={styles.tidalDividerWrap} aria-hidden="true">
          <Image
            src="/preview/events-pilot/tidal-lace.svg"
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
            src="/preview/events-pilot/coral-garden.svg"
            alt=""
            aria-hidden="true"
            width={240}
            height={240}
            loading="eager"
            unoptimized
            className={styles.coralFooterAccent}
          />
        </div>
      </main>

      {/* Mobile Focused Event Detail Dialog (< 768px only) */}
      <Dialog
        open={Boolean(selectedEvent) && !isDesktop}
        onClose={() => setSelectedEventId(null)}
        title={selectedEvent?.title ?? 'Event details'}
        portal
        className="max-w-[92%] max-h-[86dvh] overflow-y-auto"
      >
        {selectedEvent ? renderDetailContent(selectedEvent, () => setSelectedEventId(null), true) : null}
      </Dialog>

      {/* Large Centered Two-Column Event Editor Demo + Dirty Close / Draft Prompt */}
      {editorOpen && (
        <div
          style={{ zIndex: 'var(--z-drawer)' }}
          className="fixed inset-0 flex items-center justify-center p-0 sm:p-6"
        >
          <div
            aria-hidden="true"
            onClick={requestCloseEditor}
            className="fixed inset-0 bg-ws-scrim"
          />
          <div
            ref={editorPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={editorHeadingId}
            tabIndex={-1}
            data-theme="workspace"
            data-feature-theme="events"
            className={styles.largeEditorPanel}
          >
            <div className="flex items-center justify-between gap-3 border-b border-ws-border px-5 py-4 bg-ws-bg">
              <div>
                <h2 id={editorHeadingId} className="font-display text-[1.5rem] leading-none text-ws-text">
                  {editingRecord ? 'Edit event' : 'New event'}
                </h2>
                <p className="mt-1 text-[length:var(--fs-micro)] text-ws-text-muted">
                  Large editor prototype · {isEditorDirty ? 'Unsaved edits' : 'No unsaved edits'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close event editor"
                onClick={requestCloseEditor}
                className="inline-flex h-10 w-10 items-center justify-center rounded-pill text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              id="pilot-event-editor-form"
              onSubmit={handleEditorSubmit}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
            >
              {availableDraft ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-item border border-ws-border bg-ws-accent-soft px-4 py-2.5 text-[length:var(--fs-small)]">
                  <span className="text-ws-text">
                    Local fixture draft saved at {availableDraft.savedAtLabel}.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFormValues(availableDraft.values);
                        setDraftNotice('Restored fixture draft.');
                      }}
                    >
                      Resume draft
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSavedDrafts((prev) => {
                          const next = { ...prev };
                          delete next[activeDraftKey];
                          return next;
                        });
                      }}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              ) : null}

              {draftNotice ? (
                <p className="text-[length:var(--fs-small)] text-ws-accent">{draftNotice}</p>
              ) : null}

              {editorError ? (
                <p
                  role="alert"
                  className="rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3.5 py-2.5 text-[length:var(--fs-small)] text-text-overdue"
                >
                  {editorError}
                </p>
              ) : null}

              <div className={styles.largeEditorGrid}>
                {/* Wide Main Column */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pilot-event-title"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text"
                    >
                      Title
                    </label>
                    <input
                      ref={editorTitleInputRef}
                      id="pilot-event-title"
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
                      htmlFor="pilot-event-notes"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text"
                    >
                      Notes & instructions
                    </label>
                    <textarea
                      id="pilot-event-notes"
                      rows={7}
                      value={formValues.notes}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Preparation steps, room details, materials, or talking points…"
                      className="w-full max-w-[66ch] rounded-item border border-ws-border bg-ws-surface p-3.5 text-[length:var(--fs-ui)] leading-relaxed text-ws-text"
                    />
                  </div>
                </div>

                {/* Narrower Metadata Column */}
                <div className="space-y-4 rounded-card border border-ws-border bg-ws-bg p-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pilot-event-category"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text"
                    >
                      Category
                    </label>
                    <select
                      id="pilot-event-category"
                      value={formValues.category ?? ''}
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
                        htmlFor="pilot-event-date"
                        className="text-[length:var(--fs-small)] font-medium text-ws-text"
                      >
                        Date
                      </label>
                      <input
                        id="pilot-event-date"
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
                        htmlFor="pilot-event-time"
                        className="text-[length:var(--fs-small)] font-medium text-ws-text"
                      >
                        Time
                      </label>
                      <input
                        id="pilot-event-time"
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
                      htmlFor="pilot-event-location"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text"
                    >
                      Location
                    </label>
                    <input
                      id="pilot-event-location"
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
                </div>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ws-border bg-ws-bg px-5 py-3.5">
              <Button variant="ghost" size="sm" onClick={handleSaveExplicitDraft}>
                Save draft
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={requestCloseEditor}>
                  Cancel
                </Button>
                <Button type="submit" form="pilot-event-editor-form" variant="primary" size="sm">
                  {editingRecord ? 'Save changes' : 'Create event'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three-choice Unsaved Edits Prompt */}
      <Dialog
        open={dirtyPromptOpen}
        onClose={() => setDirtyPromptOpen(false)}
        title="Save edits before closing?"
        description="Your event edits have not been applied yet."
        portal
        className="max-w-[420px]"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={discardEditorChanges}>
              Discard changes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDirtyPromptOpen(false)}>
              Continue editing
            </Button>
            <Button variant="primary" size="sm" onClick={saveFixtureDraftAndClose}>
              Save draft and close
            </Button>
          </div>
        }
      />

      {/* Theme Propagation Previews (Universe inherits Aquatic; Notifications stays Sakura) */}
      <Dialog
        open={universePreviewOpen}
        onClose={() => setUniversePreviewOpen(false)}
        title="Universe menu preview (Events palette)"
        description="Demonstrates active feature theme inheritance without changing underlying page color."
        portal
        footer={
          <Button variant="secondary" size="sm" onClick={() => setUniversePreviewOpen(false)}>
            Close preview
          </Button>
        }
      >
        <p className="text-[length:var(--fs-small)] text-ws-text-muted">
          In Epic 03, pressing Universe or Ctrl+K propagates `data-feature-theme=&quot;events&quot;`
          across the topbar menu so navigation adopts the soft underwater blue palette.
        </p>
      </Dialog>

      {bellPreviewOpen && (
        <FeatureThemeProvider name="notification">
          <Dialog
            open={bellPreviewOpen}
            onClose={() => setBellPreviewOpen(false)}
            title="Notifications (Sakura overlay)"
            description="Notifications always remain Sakura rose-pink even when opened over Aquatic Events."
            portal
            footer={
              <Button variant="secondary" size="sm" onClick={() => setBellPreviewOpen(false)}>
                Close preview
              </Button>
            }
          >
            <p className="text-[length:var(--fs-small)] text-ws-text-muted">
              Opening this Sakura overlay leaves the Aquatic Events viewport untouched underneath.
            </p>
          </Dialog>
        </FeatureThemeProvider>
      )}
    </div>
  );
}
