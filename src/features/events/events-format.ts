import type { EventOccurrence } from '@/contracts/event';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';

const TZ = DEFAULT_APP_TIMEZONE;

function noonOf(date: string): Date {
  return new Date(`${date}T12:00:00+07:00`);
}

export function formatShortDay(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: TZ }).format(
    noonOf(date),
  );
}

export function formatDayHeader(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  }).format(noonOf(date));
}

export function formatWeekdayShort(date: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ }).format(noonOf(date));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function formatDetailDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "09:30 – 11:30", or a dated end for multi-day events. */
export function formatTimeRange(occurrence: Pick<EventOccurrence, 'startAt' | 'endAt'>): string {
  const start = formatTime(occurrence.startAt);
  if (!occurrence.endAt) return start;
  const sameDay =
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(occurrence.startAt)) ===
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(occurrence.endAt));
  return sameDay
    ? `${start} – ${formatTime(occurrence.endAt)}`
    : `${start} – ${formatDetailDate(occurrence.endAt)} ${formatTime(occurrence.endAt)}`;
}

/** Visible label for an inclusive date range. */
export function formatRangeLabel(from: string, lastInclusive: string): string {
  return `${formatShortDay(from)} – ${formatShortDay(lastInclusive)}`;
}

export function formatTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return 'recently';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(new Date(ms));
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
