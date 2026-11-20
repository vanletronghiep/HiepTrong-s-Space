import { formatScheduledDate, shiftScheduledDate } from './time';
import type { EventItem } from '@/contracts/event';

export interface EventStats {
  upcomingCount: number;
  thisWeekCount: number;
  approachingExamsCount: number;
}

export function computeEventStats(events: EventItem[], now: Date = new Date()): EventStats {
  const nowMs = now.getTime();
  const oneWeekLaterMs = nowMs + 7 * 24 * 60 * 60 * 1000;
  const days = getEventWeekDates(now);

  let upcomingCount = 0;
  let thisWeekCount = 0;
  let approachingExamsCount = 0;

  for (const event of events) {
    const startMs = Date.parse(event.startAt);
    if (!Number.isNaN(startMs)) {
      if (days.includes(formatScheduledDate(event.startAt))) thisWeekCount += 1;
      if (startMs >= nowMs) {
        upcomingCount += 1;
        if (startMs <= oneWeekLaterMs) {
          if (event.isExam || event.category === 'exam') {
            approachingExamsCount += 1;
          }
        }
      }
    }
  }

  return { upcomingCount, thisWeekCount, approachingExamsCount };
}

export function formatRelativeEventTime(startIso: string, now: Date = new Date()): string {
  const startMs = Date.parse(startIso);
  if (Number.isNaN(startMs)) return '';

  const diffMs = startMs - now.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffMs < 0) {
    const absMinutes = Math.abs(diffMinutes);
    if (absMinutes < 60) return `${absMinutes}m ago`;
    const absHours = Math.abs(diffHours);
    if (absHours < 24) return `${absHours}h ago`;
    return `${Math.abs(diffDays)}d ago`;
  }

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? 'due now' : `in ${diffMinutes}m`;
  }
  if (diffHours < 24) {
    return `in ${diffHours}h`;
  }
  if (diffDays === 1) {
    return 'tomorrow';
  }
  return `in ${diffDays}d`;
}

export function getUpcomingExams(events: EventItem[], now: Date = new Date()): EventItem[] {
  const nowMs = now.getTime();
  return events
    .filter((e) => (e.isExam || e.category === 'exam') && Date.parse(e.startAt) >= nowMs)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

/** Monday-first calendar dates in the application's timezone. */
export function getEventWeekDates(now: Date = new Date()): string[] {
  const today = formatScheduledDate(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const monday = shiftScheduledDate(today, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftScheduledDate(monday, index));
}

export function eventsForWeekday(
  events: EventItem[],
  index: number,
  now = new Date(),
): EventItem[] {
  const date = getEventWeekDates(now)[index];
  return events.filter((event) => formatScheduledDate(event.startAt) === date);
}

const WEB_URL_RE = /^(?:https?:\/\/|www\.)[^\s]+$/i;

/** Supported web links in the single "Location or link" field (http, https, or www.). */
export function isWebUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && WEB_URL_RE.test(value.trim());
}

/** Navigable href for a detected web link; `www.` hosts get https. */
export function toWebHref(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
