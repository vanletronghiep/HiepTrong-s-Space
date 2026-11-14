import type { EventCategory, EventItem } from '@/contracts/event';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from './time';

export type EventHorizon = 'upcoming' | 'past' | 'week';

export interface MonthGridDay {
  dateStr: string;
  inMonth: boolean;
  dayNum: number;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

export function monthKeyFromDateStr(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yearPart, monthPart] = monthKey.split('-').map(Number);
  const year = yearPart && !Number.isNaN(yearPart) ? yearPart : 2026;
  const month = monthPart && !Number.isNaN(monthPart) ? monthPart : 1;
  const target = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  return `${target.getUTCFullYear()}-${pad2(target.getUTCMonth() + 1)}`;
}

export function formatMonthTitle(monthKey: string): string {
  const [yearPart, monthPart] = monthKey.split('-').map(Number);
  const year = yearPart && !Number.isNaN(yearPart) ? yearPart : 2026;
  const month = monthPart && !Number.isNaN(monthPart) ? monthPart : 1;
  const target = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(target);
}

/**
 * Returns a stable 6-row Monday-first month matrix (42 cells) for `YYYY-MM`.
 */
export function getMonthGridDays(monthKey: string): MonthGridDay[] {
  const firstDay = `${monthKey}-01`;
  const weekday = new Date(`${firstDay}T12:00:00Z`).getUTCDay();
  const mondayOffset = -((weekday + 6) % 7);
  const startStr = shiftScheduledDate(firstDay, mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const dateStr = shiftScheduledDate(startStr, index);
    return {
      dateStr,
      inMonth: dateStr.slice(0, 7) === monthKey,
      dayNum: Number(dateStr.slice(8, 10)),
    };
  });
}

/**
 * Returns the 7 Monday-first 'YYYY-MM-DD' calendar days containing `anchorDateStr`.
 */
export function getWeekDaysForAnchor(anchorDateStr: string): string[] {
  const weekday = new Date(`${anchorDateStr}T12:00:00Z`).getUTCDay();
  const monday = shiftScheduledDate(anchorDateStr, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftScheduledDate(monday, index));
}

export function matchesEventCategory(
  event: EventItem,
  categoryFilter: 'all' | EventCategory,
): boolean {
  return (
    categoryFilter === 'all' ||
    event.category === categoryFilter ||
    (categoryFilter === 'exam' && event.isExam)
  );
}

export function getAgendaEventsForState(options: {
  events: EventItem[];
  horizon: EventHorizon;
  categoryFilter: 'all' | EventCategory;
  selectedDate: string | null;
  now: Date;
  timeZone?: string;
}): EventItem[] {
  const {
    events,
    horizon,
    categoryFilter,
    selectedDate,
    now,
    timeZone = DEFAULT_APP_TIMEZONE,
  } = options;

  const matched = events.filter((evt) => matchesEventCategory(evt, categoryFilter));

  if (selectedDate) {
    return matched
      .filter((evt) => formatScheduledDate(evt.startAt, timeZone) === selectedDate)
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  }

  const nowMs = now.getTime();
  if (horizon === 'past') {
    return matched
      .filter((evt) => Date.parse(evt.startAt) < nowMs)
      .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
  }

  return matched
    .filter((evt) => Date.parse(evt.startAt) >= nowMs)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

