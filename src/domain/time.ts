import { addDays, format, parseISO } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { isValidCalendarDay } from '@/contracts';

export const DEFAULT_APP_TIMEZONE = 'Asia/Saigon';

function toZonedDate(instant: Date | string, timeZone: string): TZDate {
  const baseDate = typeof instant === 'string' ? parseISO(instant) : instant;
  return new TZDate(baseDate.getTime(), timeZone);
}

/**
 * Formats an instant into 'YYYY-MM-DD' in the given timezone.
 */
export function formatScheduledDate(
  instant: Date | string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  return format(toZonedDate(instant, timeZone), 'yyyy-MM-dd');
}

/**
 * Formats an instant as 'DD/MM' when in the same calendar year as `referenceNow`
 * (evaluated in `timeZone`), or 'DD/MM/YYYY' for a different year.
 */
export function formatDisplayDate(
  instant: Date | string,
  referenceNow: Date,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  const target = toZonedDate(instant, timeZone);
  const current = toZonedDate(referenceNow, timeZone);
  const pattern = target.getFullYear() === current.getFullYear() ? 'dd/MM' : 'dd/MM/yyyy';
  return format(target, pattern);
}

/**
 * Formats an instant as 'DD/MM HH:mm' (or 'DD/MM/YYYY HH:mm' if outside current year).
 */
export function formatDisplayDateTime(
  instant: Date | string,
  referenceNow: Date,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  const target = toZonedDate(instant, timeZone);
  const datePart = formatDisplayDate(instant, referenceNow, timeZone);
  return `${datePart} ${format(target, 'HH:mm')}`;
}

function parseScheduledDateParts(scheduledDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(scheduledDate);
  if (!dateMatch) {
    throw new RangeError(`Invalid scheduledDate: "${scheduledDate}"`);
  }
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  if (!isValidCalendarDay(year, month, day)) {
    throw new RangeError(`Non-existent calendar date: "${scheduledDate}"`);
  }
  return { year, month, day };
}

/**
 * Formats an instant as 'HH:mm · ddd · d MMM' in `timeZone` (for compact Hub cards).
 */
export function formatHubDeadline(
  instant: Date | string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  return format(toZonedDate(instant, timeZone), 'HH:mm · EEE · d MMM');
}

/**
 * Formats an instant as 'HH:mm · ddd · d MMM yyyy' in `timeZone` (for Task Inspector).
 */
export function formatInspectorDeadline(
  instant: Date | string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  return format(toZonedDate(instant, timeZone), 'HH:mm · EEE · d MMM yyyy');
}

/**
 * Formats a 'YYYY-MM-DD' scheduled date as 'ddd · d MMM yyyy' in `timeZone`.
 */
export function formatScheduledDateWithYear(
  scheduledDate: string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  const { year, month, day } = parseScheduledDateParts(scheduledDate);
  const anchor = new TZDate(year, month - 1, day, 12, 0, 0, 0, timeZone);
  return format(anchor, 'EEE · d MMM yyyy');
}

/**
 * Combines a 'YYYY-MM-DD' calendar date and 'HH:mm' 24h time in `timeZone`
 * and returns a canonical UTC ISO-8601 instant string.
 */
export function buildZonedInstant(
  scheduledDate: string,
  timeHm: string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeHm);
  if (!timeMatch) {
    throw new RangeError(`Invalid date/time input: "${scheduledDate}" "${timeHm}"`);
  }

  const { year, month, day } = parseScheduledDateParts(scheduledDate);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new RangeError(`Out-of-range date/time input: "${scheduledDate}" "${timeHm}"`);
  }

  const zoned = new TZDate(year, month - 1, day, hour, minute, 0, 0, timeZone);
  return new Date(zoned.getTime()).toISOString();
}

/**
 * Shifts a 'YYYY-MM-DD' date by `deltaDays` within `timeZone`.
 */
export function shiftScheduledDate(
  scheduledDate: string,
  deltaDays: number,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): string {
  const { year, month, day } = parseScheduledDateParts(scheduledDate);
  // Use noon in the target timezone so DST transitions (if another timezone is configured) cannot skip/repeat a day.
  const anchor = new TZDate(year, month - 1, day, 12, 0, 0, 0, timeZone);
  return format(addDays(anchor, deltaDays), 'yyyy-MM-dd');
}
