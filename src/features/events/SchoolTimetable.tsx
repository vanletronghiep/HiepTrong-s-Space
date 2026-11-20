'use client';

import { Fragment, type CSSProperties } from 'react';
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
  formatTimeRange,
  formatWeekdayShort,
  pluralize,
} from './events-format';
import overlays from './events-overlays.module.css';

export interface TimetableCell {
  primary: EventOccurrence | null;
  /** Canceled entries kept for history when a replacement (or nothing) occupies the cell. */
  canceled: EventOccurrence[];
  /** True when an earlier period's lesson spans over this period, so it draws no cell. */
  covered: boolean;
}

/** Periods an active lesson covers; canceled lessons only mark their first period. */
export function cellRowSpan(cell: TimetableCell): number {
  const primary = cell.primary;
  if (!primary || primary.period === null || primary.periodEnd === null) return 1;
  return primary.periodEnd - primary.period + 1;
}

/**
 * Timetable cells for one week, keyed by `date#firstPeriod`. Only classes covering whole
 * consecutive periods occupy cells; ordinary events never do. A multi-period lesson is one
 * cell that marks the periods beneath it as covered. At most one active class is primary;
 * canceled entries stay in history.
 */
export function buildTimetableCells(
  occurrences: readonly EventOccurrence[],
  days: readonly string[],
): Map<string, TimetableCell> {
  const cells = new Map<string, TimetableCell>();
  const cellFor = (key: string) => {
    const existing = cells.get(key);
    if (existing) return existing;
    const created: TimetableCell = { primary: null, canceled: [], covered: false };
    cells.set(key, created);
    return created;
  };
  for (const occurrence of occurrences) {
    if (occurrence.kind !== 'class' || occurrence.period === null) continue;
    const date = localDateOf(occurrence.startAt);
    if (!days.includes(date)) continue;
    const cell = cellFor(`${date}#${occurrence.period}`);
    if (occurrence.status === 'active' && !cell.primary) {
      cell.primary = occurrence;
      for (
        let p = occurrence.period + 1;
        p <= (occurrence.periodEnd ?? occurrence.period);
        p += 1
      ) {
        cellFor(`${date}#${p}`).covered = true;
      }
    } else if (occurrence.status === 'canceled') cell.canceled.push(occurrence);
  }
  return cells;
}

/** Grid row of a period: header is row 1, the afternoon divider takes row 4. */
function rowOfPeriod(index: number): number {
  return index < 2 ? index + 2 : index + 3;
}

export interface SchoolTimetableProps {
  weekStart: string;
  today: string;
  onWeekChange: (weekStart: string) => void;
  onOpenOccurrence: (occurrence: EventOccurrence) => void;
  onCreateClass: (date: string, periodIndex: number) => void;
}

/** School timetable (v3.1 §7.1): Monday–Sunday × four fixed periods; lessons may span them. */
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
    (occurrence) =>
      occurrence.kind === 'class' && occurrence.period === null && occurrence.status === 'active',
  );
  const activeClasses = [...cells.values()].filter((cell) => cell.primary).length;

  return (
    <section aria-labelledby="school-timetable-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="school-timetable-heading"
            className="font-display text-[1.6rem] font-semibold leading-tight text-ws-text"
          >
            School timetable
          </h2>
          <p className="text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
            {formatRangeLabel(days[0]!, days[6]!)} · {pluralize(activeClasses, 'class', 'classes')}{' '}
            · Monday – Sunday
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous week"
            onClick={() => onWeekChange(addDays(weekStart, -7))}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={weekStart === weekStartOf(today)}
            onClick={() => onWeekChange(weekStartOf(today))}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next week"
            onClick={() => onWeekChange(addDays(weekStart, 7))}
          >
            <ChevronRight size={16} aria-hidden="true" />
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
            <div
              role="columnheader"
              className={overlays.timeHeaderCell}
              style={{ gridRow: 1, gridColumn: 1 }}
            >
              <span className="text-[length:var(--fs-micro)] text-ws-text-muted">Starts</span>
            </div>
            {days.map((day, dayIndex) => (
              <div
                role="columnheader"
                key={day}
                aria-label={`${formatDayHeader(day)}${day === today ? ', today' : ''}`}
                className={cn(overlays.dayHeader, day === today && overlays.dayHeaderToday)}
                style={{ gridRow: 1, gridColumn: dayIndex + 2 }}
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

          <div
            className={overlays.afternoonDivider}
            role="separator"
            aria-label="Afternoon"
            style={{ gridRow: 4 }}
          >
            <span className={overlays.afternoonLabel}>Afternoon</span>
          </div>

          {TIMETABLE_PERIODS.map((period) => (
            <Fragment key={period.index}>
              <div role="row" className="contents">
                <div
                  role="rowheader"
                  className={overlays.timeCell}
                  aria-label={`${period.start} to ${period.end}`}
                  style={{ gridRow: rowOfPeriod(period.index), gridColumn: 1 }}
                >
                  <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                    {period.start}
                  </span>
                  <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
                    to {period.end}
                  </span>
                </div>
                {days.map((day, dayIndex) => {
                  const cell = cells.get(`${day}#${period.index}`);
                  if (cell?.covered) return null;
                  const shown = cell?.primary ?? cell?.canceled[0] ?? null;
                  const history = cell?.primary
                    ? (cell?.canceled ?? [])
                    : (cell?.canceled.slice(1) ?? []);
                  const rows = cell ? cellRowSpan(cell) : 1;
                  // A lesson never crosses the lunch break, so its rows are always adjacent.
                  const placement: CSSProperties = {
                    gridRow: `${rowOfPeriod(period.index)} / span ${rows}`,
                    gridColumn: dayIndex + 2,
                  };
                  const lastPeriod = cell?.primary?.periodEnd ?? period.index;
                  const labelEnd = TIMETABLE_PERIODS[lastPeriod]?.end ?? period.end;
                  const periodLabel = `${formatDayHeader(day)}, ${period.start}–${labelEnd}`;
                  if (timetableWindow.isLoading && !shown) {
                    return (
                      <div role="gridcell" key={day} style={placement}>
                        <Skeleton className="h-[5.25rem] w-full rounded-item" />
                      </div>
                    );
                  }
                  return (
                    <div
                      role="gridcell"
                      key={day}
                      className="flex min-w-0 flex-col gap-1"
                      style={placement}
                    >
                      {shown ? (
                        <button
                          type="button"
                          onClick={() => onOpenOccurrence(shown)}
                          aria-label={`${shown.title}${shown.status === 'canceled' ? ' (canceled)' : ''}, ${periodLabel}. Open details`}
                          className={cn(
                            overlays.slot,
                            overlays.slotFilled,
                            'flex-1',
                            shown.status === 'canceled' && overlays.slotCanceled,
                          )}
                        >
                          <span className={overlays.slotTitle}>{shown.title}</span>
                          {rows > 1 ? (
                            <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
                              {formatTimeRange(shown)}
                            </span>
                          ) : null}
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
                          className={cn(overlays.slot, 'flex-1')}
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
        <div className="space-y-1.5 text-[length:var(--fs-small)] text-ws-text-muted">
          <p>
            {pluralize(outOfSlot.length, 'class', 'classes')} this week use custom times that do not
            fit the timetable periods. They appear in the Week calendar only. Open one and pick
            periods to move it onto the timetable.
          </p>
          <ul className="space-y-0.5">
            {outOfSlot.map((occurrence) => (
              <li key={occurrence.key}>
                <button
                  type="button"
                  onClick={() => onOpenOccurrence(occurrence)}
                  className="rounded-sm px-1 text-left text-ws-text hover:bg-ws-accent-soft cursor-pointer"
                >
                  {occurrence.title} · {formatShortDay(localDateOf(occurrence.startAt))} ·{' '}
                  {formatTimeRange(occurrence)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
