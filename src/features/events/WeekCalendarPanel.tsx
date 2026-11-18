'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEventOccurrenceWindow } from '@/client/queries/events';
import type { EventOccurrence } from '@/contracts/event';
import { addDays, occurrenceDateSpan, weekStartOf } from '@/domain/event-occurrence';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { KindBadge, StatusBadges } from './EventBadges';
import { EventsModal } from './EventsModal';
import {
  formatDayHeader,
  formatRangeLabel,
  formatShortDay,
  formatTime,
  formatTimeRange,
  formatWeekdayShort,
  pluralize,
} from './events-format';
import overlays from './events-overlays.module.css';
import styles from './events.module.css';

export type WeekCalendarMode = 'overview' | 'day' | 'week';

export interface WeekCalendarState {
  weekStart: string;
  mode: WeekCalendarMode;
  day: string | null;
}

export interface WeekCalendarPanelProps {
  open: boolean;
  state: WeekCalendarState;
  today: string;
  now: Date;
  onChange: (next: WeekCalendarState) => void;
  onClose: () => void;
  onSelect: (occurrence: EventOccurrence) => void;
}

interface DayEntry {
  occurrence: EventOccurrence;
  continuation: 'single' | 'starts' | 'continues' | 'ends';
}

/** Each intersected date lists the occurrence once, with continuation context. */
export function groupWeekByDay(occurrences: readonly EventOccurrence[], days: readonly string[]) {
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

const CONTINUATION_LABEL: Record<DayEntry['continuation'], string | null> = {
  single: null,
  starts: 'Starts · continues',
  continues: 'Continues all day',
  ends: 'Ends',
};

function AgendaEntry({
  entry,
  now,
  onSelect,
}: {
  entry: DayEntry;
  now: Date;
  onSelect: (occurrence: EventOccurrence) => void;
}) {
  const { occurrence, continuation } = entry;
  return (
    <button
      type="button"
      onClick={() => onSelect(occurrence)}
      className={cn(styles.eventRow, occurrence.status === 'canceled' && overlays.chipCanceled)}
    >
      <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <KindBadge occurrence={occurrence} />
        <StatusBadges occurrence={occurrence} now={now} />
        {CONTINUATION_LABEL[continuation] ? (
          <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
            {CONTINUATION_LABEL[continuation]}
          </span>
        ) : null}
      </span>
      <span className={cn(styles.eventTitleCompact, overlays.chipTitle)}>{occurrence.title}</span>
      <span className="mt-1 block text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
        {formatTimeRange(occurrence)}
        {occurrence.location ? ` · ${occurrence.location}` : ''}
      </span>
    </button>
  );
}

/**
 * Week Calendar (v3.1 §6.4): opens on the current Monday–Sunday week in Overview, all
 * categories, independent of the dashboard filter. Day → Expanded agenda; Whole week →
 * grouped agendas. The selected week survives mode changes and reader round-trips.
 */
export function WeekCalendarPanel({
  open,
  state,
  today,
  now,
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
  const shiftWeek = (weeks: number) =>
    onChange({
      ...state,
      weekStart: addDays(state.weekStart, weeks * 7),
      day: null,
      mode: state.mode === 'day' ? 'overview' : state.mode,
    });

  const title = (
    <div className="space-y-1">
      <h2 className="font-display text-[1.5rem] font-medium leading-tight text-ws-text">
        Week calendar
      </h2>
      <p className="text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
        {formatRangeLabel(days[0]!, days[6]!)} · {pluralize(activeCount, 'event')} · Monday –
        Sunday, Asia/Saigon
      </p>
    </div>
  );

  const agendaDays = state.mode === 'day' && state.day ? [state.day] : days;

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft size={15} aria-hidden="true" />}
            onClick={() => shiftWeek(-1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onChange({
                weekStart: weekStartOf(today),
                mode: state.mode === 'day' ? 'overview' : state.mode,
                day: null,
              })
            }
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ChevronRight size={15} aria-hidden="true" />}
            onClick={() => shiftWeek(1)}
          >
            Next
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {state.mode !== 'overview' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...state, mode: 'overview', day: null })}
            >
              Back to overview
            </Button>
          ) : null}
          {state.mode !== 'week' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onChange({ ...state, mode: 'week', day: null })}
            >
              Whole week
            </Button>
          ) : null}
        </div>
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

      {state.mode === 'overview' ? (
        <div className={overlays.weekOverview} role="list" aria-label="Days of the week">
          {days.map((day) => {
            const entries = byDay.get(day) ?? [];
            const active = entries.filter((entry) => entry.occurrence.status === 'active').length;
            const canceled = entries.length - active;
            const isToday = day === today;
            return (
              <div role="listitem" key={day} className="min-w-0">
                <button
                  type="button"
                  aria-label={`${formatDayHeader(day)}${isToday ? ', today' : ''}: ${pluralize(active, 'event')}${canceled ? `, ${canceled} canceled` : ''}. Open day agenda`}
                  onClick={() => onChange({ ...state, mode: 'day', day })}
                  className={cn(overlays.dayColumn, isToday && overlays.dayColumnToday, 'w-full')}
                >
                  <span className="flex items-baseline justify-between gap-1 border-b border-ws-border pb-1.5">
                    <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                      {formatWeekdayShort(day)} {formatShortDay(day).split(' ')[1]}
                    </span>
                    <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                      {isToday ? 'Today · ' : ''}
                      {active}
                    </span>
                  </span>
                  {entries.length === 0 ? (
                    <span className="text-[length:var(--fs-micro)] text-ws-text-muted">Clear</span>
                  ) : (
                    entries.slice(0, 4).map(({ occurrence, continuation }) => (
                      <span
                        key={occurrence.key}
                        className={cn(
                          overlays.dayChip,
                          occurrence.status === 'canceled' && overlays.chipCanceled,
                        )}
                      >
                        <span className={overlays.chipTitle}>{occurrence.title}</span>
                        <span className="text-ws-text-muted tabular-nums">
                          {continuation === 'continues' || continuation === 'ends'
                            ? 'Continues'
                            : formatTime(occurrence.startAt)}
                          {occurrence.status === 'canceled' ? ' · canceled' : ''}
                        </span>
                      </span>
                    ))
                  )}
                  {entries.length > 4 ? (
                    <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
                      +{entries.length - 4} more
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {agendaDays.map((day) => {
            const entries = byDay.get(day) ?? [];
            return (
              <section key={day} className={overlays.agendaDay} aria-label={formatDayHeader(day)}>
                <h3 className="font-display text-[1.2rem] font-medium text-ws-text">
                  {formatDayHeader(day)}
                  {day === today ? (
                    <span className="ml-2 align-middle text-[length:var(--fs-micro)] font-ui text-ws-accent">
                      Today
                    </span>
                  ) : null}
                </h3>
                {entries.length === 0 ? (
                  <p className="text-[length:var(--fs-small)] text-ws-text-muted">
                    Nothing scheduled.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {entries.map((entry) => (
                      <li key={entry.occurrence.key}>
                        <AgendaEntry entry={entry} now={now} onSelect={onSelect} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </EventsModal>
  );
}
