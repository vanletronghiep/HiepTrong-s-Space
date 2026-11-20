'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEventOccurrenceWindow } from '@/client/queries/events';
import type { EventOccurrence } from '@/contracts/event';
import { addDays, occurrenceDateSpan, weekStartOf } from '@/domain/event-occurrence';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/Skeleton';
import { EventsModal } from './EventsModal';
import {
  formatDayHeader,
  formatRangeLabel,
  formatShortDay,
  formatTime,
  formatWeekdayShort,
  pluralize,
} from './events-format';
import overlays from './events-overlays.module.css';

export interface WeekCalendarState {
  weekStart: string;
}

export interface WeekCalendarPanelProps {
  open: boolean;
  state: WeekCalendarState;
  today: string;
  onChange: (next: WeekCalendarState) => void;
  onClose: () => void;
  onSelect: (occurrence: EventOccurrence) => void;
}

interface DayEntry {
  occurrence: EventOccurrence;
  continuation: 'single' | 'starts' | 'continues' | 'ends';
}

/** Each intersected date lists the occurrence once, with continuation context. */
function groupWeekByDay(occurrences: readonly EventOccurrence[], days: readonly string[]) {
  const byDay = new Map<string, DayEntry[]>(days.map((day) => [day, []]));
  for (const occurrence of occurrences) {
    const span = occurrenceDateSpan(occurrence);
    for (const day of days) {
      if (day < span.first || day > span.last) continue;
      const continuation =
        span.first === span.last
          ? 'single'
          : day === span.first
            ? 'starts'
            : day === span.last
              ? 'ends'
              : 'continues';
      byDay.get(day)?.push({ occurrence, continuation });
    }
  }
  return byDay;
}

/** Chips visible in a day column before it scrolls. */
const VISIBLE_CHIPS = 4;

/**
 * One day's events in a fixed-height column: identical chips, four visible, the rest scroll
 * inside the column. The "+N more" hint fades out as the list scrolls down. Each chip opens
 * its event directly.
 */
function DayChips({
  entries,
  isLoading,
  onSelect,
}: {
  entries: DayEntry[];
  isLoading: boolean;
  onSelect: (occurrence: EventOccurrence) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(1);
  const hiddenCount = entries.length - VISIBLE_CHIPS;

  const measure = useCallback(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const remaining = element.scrollHeight - element.clientHeight - element.scrollTop;
    setFade(Math.max(0, Math.min(1, remaining / 40)));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, entries.length]);

  return (
    <div className={overlays.dayBodyWrap}>
      <div ref={scrollerRef} className={overlays.dayBody} onScroll={measure}>
        {entries.length === 0 ? (
          isLoading ? (
            <Skeleton className="h-11 w-full rounded-sm" />
          ) : (
            <span className="text-[length:var(--fs-micro)] text-ws-text-muted">Clear</span>
          )
        ) : (
          entries.map(({ occurrence, continuation }) => {
            const timeLabel =
              continuation === 'continues' || continuation === 'ends'
                ? 'Continues'
                : formatTime(occurrence.startAt);
            return (
              <button
                key={occurrence.key}
                type="button"
                onClick={() => onSelect(occurrence)}
                aria-label={`${occurrence.title}, ${timeLabel}${occurrence.status === 'canceled' ? ', canceled' : ''}. Open details`}
                className={cn(
                  overlays.dayChip,
                  occurrence.status === 'canceled' && overlays.chipCanceled,
                )}
              >
                <span className={overlays.chipTitle}>{occurrence.title}</span>
                <span className="text-ws-text-muted tabular-nums">
                  {timeLabel}
                  {occurrence.status === 'canceled' ? ' · canceled' : ''}
                </span>
              </button>
            );
          })
        )}
      </div>
      {hiddenCount > 0 ? (
        <span className={overlays.moreHint} style={{ opacity: fade }} aria-hidden="true">
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  );
}

/**
 * Week calendar (v3.3): the current Monday–Sunday week as one overview. Day headers are plain
 * text; each event chip opens its details directly. The selected week survives reader round-trips.
 */
export function WeekCalendarPanel({
  open,
  state,
  today,
  onChange,
  onClose,
  onSelect,
}: WeekCalendarPanelProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(state.weekStart, index));
  const weekWindow = useEventOccurrenceWindow(state.weekStart, addDays(state.weekStart, 7), {
    enabled: open,
  });
  const byDay = groupWeekByDay(weekWindow.occurrences, days);
  const activeCount = weekWindow.occurrences.filter((o) => o.status === 'active').length;
  const shiftWeek = (weeks: number) => onChange({ weekStart: addDays(state.weekStart, weeks * 7) });

  const title = (
    <div className="space-y-1">
      <h2 className="font-display text-[1.5rem] font-semibold leading-tight text-ws-text">
        Week calendar
      </h2>
      <p className="text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
        {formatRangeLabel(days[0]!, days[6]!)} · {pluralize(activeCount, 'event')} · Monday – Sunday
      </p>
    </div>
  );

  return (
    <EventsModal
      open={open}
      onClose={onClose}
      size="calendar"
      title={title}
      ariaLabel="Week calendar"
      closeLabel="Close week calendar"
      testId="week-calendar-panel"
    >
      <div className="mb-4 flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          aria-label="Previous week"
          onClick={() => shiftWeek(-1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange({ weekStart: weekStartOf(today) })}
        >
          Today
        </Button>
        <Button variant="secondary" size="sm" aria-label="Next week" onClick={() => shiftWeek(1)}>
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>

      {weekWindow.isError ? (
        <div
          role="alert"
          className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3 py-2 text-[length:var(--fs-small)] text-text-overdue"
        >
          <span>Could not load this week.</span>
          <Button variant="secondary" size="sm" onClick={weekWindow.refetch}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className={overlays.weekOverview} role="list" aria-label="Days of the week">
        {days.map((day) => {
          const entries = byDay.get(day) ?? [];
          const active = entries.filter((entry) => entry.occurrence.status === 'active').length;
          const isToday = day === today;
          return (
            <div role="listitem" key={day} className="min-w-0">
              <div className={cn(overlays.dayColumn, isToday && overlays.dayColumnToday)}>
                <div className={overlays.dayColumnHeader}>
                  <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                    {formatWeekdayShort(day)} {formatShortDay(day).split(' ')[1]}
                  </span>
                  <span
                    className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums"
                    aria-label={`${formatDayHeader(day)}${isToday ? ', today' : ''}: ${pluralize(active, 'event')}`}
                  >
                    {isToday ? 'Today · ' : ''}
                    {active}
                  </span>
                </div>
                <DayChips entries={entries} isLoading={weekWindow.isLoading} onSelect={onSelect} />
              </div>
            </div>
          );
        })}
      </div>
    </EventsModal>
  );
}
