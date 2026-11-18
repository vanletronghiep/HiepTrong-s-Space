'use client';

import { Fragment } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEventOccurrenceWindow } from '@/client/queries/events';
import { TIMETABLE_PERIODS, type EventOccurrence } from '@/contracts/event';
import { addDays, localDateOf, weekStartOf } from '@/domain/event-occurrence';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/Skeleton';
import {
  formatDayHeader,
  formatRangeLabel,
  formatShortDay,
  formatWeekdayShort,
  pluralize,
} from './events-format';
import overlays from './events-overlays.module.css';

export interface TimetableCell {
  primary: EventOccurrence | null;
  /** Canceled entries kept for history when a replacement (or nothing) occupies the cell. */
  canceled: EventOccurrence[];
}

/**
 * Timetable cells for one week: only classes matching a period exactly occupy cells; ordinary
 * events never do. At most one active class is primary; canceled entries stay in history.
 */
export function buildTimetableCells(
  occurrences: readonly EventOccurrence[],
  days: readonly string[],
): Map<string, TimetableCell> {
  const cells = new Map<string, TimetableCell>();
  for (const occurrence of occurrences) {
    if (occurrence.kind !== 'class' || occurrence.period === null) continue;
    const date = localDateOf(occurrence.startAt);
    if (!days.includes(date)) continue;
    const key = `${date}#${occurrence.period}`;
    const cell = cells.get(key) ?? { primary: null, canceled: [] };
    if (occurrence.status === 'active' && !cell.primary) cell.primary = occurrence;
    else if (occurrence.status === 'canceled') cell.canceled.push(occurrence);
    cells.set(key, cell);
  }
  return cells;
}

export interface SchoolTimetableProps {
  weekStart: string;
  today: string;
  onWeekChange: (weekStart: string) => void;
  onOpenOccurrence: (occurrence: EventOccurrence) => void;
  onCreateClass: (date: string, periodIndex: number) => void;
}

/** School timetable (v3.1 §7.1): Monday–Sunday × four fixed periods, Asia/Saigon. */
export function SchoolTimetable({
  weekStart,
  today,
  onWeekChange,
  onOpenOccurrence,
  onCreateClass,
}: SchoolTimetableProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const timetableWindow = useEventOccurrenceWindow(weekStart, addDays(weekStart, 7));
  const cells = buildTimetableCells(timetableWindow.occurrences, days);
  const outOfSlot = timetableWindow.occurrences.filter(
    (occurrence) => occurrence.kind === 'class' && occurrence.period === null,
  );
  const activeClasses = [...cells.values()].filter((cell) => cell.primary).length;

  return (
    <section aria-labelledby="school-timetable-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="school-timetable-heading"
            className="font-display text-[1.6rem] font-medium leading-tight text-ws-text"
          >
            School timetable
          </h2>
          <p className="text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
            {formatRangeLabel(days[0]!, days[6]!)} · {pluralize(activeClasses, 'class', 'classes')}{' '}
            · Monday – Sunday, Asia/Saigon
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft size={15} aria-hidden="true" />}
            onClick={() => onWeekChange(addDays(weekStart, -7))}
          >
            Previous week
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={weekStart === weekStartOf(today)}
            onClick={() => onWeekChange(weekStartOf(today))}
          >
            This week
          </Button>
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ChevronRight size={15} aria-hidden="true" />}
            onClick={() => onWeekChange(addDays(weekStart, 7))}
          >
            Next week
          </Button>
        </div>
      </div>

      {timetableWindow.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3 py-2 text-[length:var(--fs-small)] text-text-overdue"
        >
          <span>Could not load this week’s timetable.</span>
          <Button variant="secondary" size="sm" onClick={timetableWindow.refetch}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className={overlays.timetableScroller}>
        <div className={overlays.timetable} role="grid" aria-label="Weekly school timetable">
          <div role="row" className="contents">
            <div role="columnheader" className={overlays.timeHeaderCell}>
              <span className="text-[length:var(--fs-micro)] text-ws-text-muted">Starts</span>
            </div>
            {days.map((day) => (
              <div
                role="columnheader"
                key={day}
                aria-label={`${formatDayHeader(day)}${day === today ? ', today' : ''}`}
                className={cn(overlays.dayHeader, day === today && overlays.dayHeaderToday)}
              >
                <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                  {formatWeekdayShort(day)}
                </span>
                <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                  {formatShortDay(day)}
                  {day === today ? ' · Today' : ''}
                </span>
              </div>
            ))}
          </div>

          {TIMETABLE_PERIODS.map((period) => (
            <Fragment key={period.index}>
              {period.index === 2 ? (
                <div className={overlays.afternoonDivider} role="separator" aria-label="Afternoon">
                  <span className={overlays.afternoonLabel}>Afternoon</span>
                </div>
              ) : null}
              <div role="row" className="contents">
                <div
                  role="rowheader"
                  className={overlays.timeCell}
                  aria-label={`${period.start} to ${period.end}`}
                >
                  <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                    {period.start}
                  </span>
                  <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
                    to {period.end}
                  </span>
                </div>
                {days.map((day) => {
                  const cell = cells.get(`${day}#${period.index}`);
                  const shown = cell?.primary ?? cell?.canceled[0] ?? null;
                  const history = cell?.primary
                    ? (cell?.canceled ?? [])
                    : (cell?.canceled.slice(1) ?? []);
                  const periodLabel = `${formatDayHeader(day)}, ${period.start}–${period.end}`;
                  if (timetableWindow.isLoading && !shown) {
                    return (
                      <div role="gridcell" key={day}>
                        <Skeleton className="h-[5.25rem] w-full rounded-item" />
                      </div>
                    );
                  }
                  return (
                    <div role="gridcell" key={day} className="flex min-w-0 flex-col gap-1">
                      {shown ? (
                        <button
                          type="button"
                          onClick={() => onOpenOccurrence(shown)}
                          aria-label={`${shown.title}${shown.status === 'canceled' ? ' (canceled)' : ''}, ${periodLabel}. Open details`}
                          className={cn(
                            overlays.slot,
                            overlays.slotFilled,
                            shown.status === 'canceled' && overlays.slotCanceled,
                          )}
                        >
                          <span className={overlays.slotTitle}>{shown.title}</span>
                          {shown.location ? (
                            <span className="truncate text-[length:var(--fs-micro)] text-ws-text-muted">
                              {shown.location}
                            </span>
                          ) : null}
                          {shown.status === 'canceled' ? (
                            <span className="text-[length:var(--fs-micro)] text-text-overdue">
                              Canceled
                            </span>
                          ) : null}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCreateClass(day, period.index)}
                          aria-label={`Add a class on ${periodLabel}`}
                          className={overlays.slot}
                        >
                          <span
                            className={cn(overlays.slotAddHint, 'inline-flex items-center gap-1')}
                          >
                            <Plus size={13} aria-hidden="true" /> Add class
                          </span>
                        </button>
                      )}
                      {history.map((canceled) => (
                        <button
                          key={canceled.key}
                          type="button"
                          onClick={() => onOpenOccurrence(canceled)}
                          className="truncate rounded-sm px-1 text-left text-[length:var(--fs-micro)] text-ws-text-muted line-through hover:bg-ws-accent-soft cursor-pointer"
                          aria-label={`Canceled: ${canceled.title}, ${periodLabel}. Open details`}
                        >
                          {canceled.title}
                        </button>
                      ))}
                      {shown && shown.status === 'canceled' ? (
                        <button
                          type="button"
                          onClick={() => onCreateClass(day, period.index)}
                          aria-label={`Add a replacement class on ${periodLabel}`}
                          className="inline-flex items-center gap-1 rounded-sm px-1 text-left text-[length:var(--fs-micro)] text-ws-accent hover:bg-ws-accent-soft cursor-pointer"
                        >
                          <Plus size={12} aria-hidden="true" /> Replacement
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {outOfSlot.length > 0 ? (
        <p className="text-[length:var(--fs-small)] text-ws-text-muted">
          {pluralize(outOfSlot.length, 'class', 'classes')} this week fall outside the timetable
          periods and appear in the regular lists and Week calendar only.
        </p>
      ) : null}
    </section>
  );
}
