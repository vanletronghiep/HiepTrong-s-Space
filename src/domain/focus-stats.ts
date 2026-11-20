import { TZDate } from '@date-fns/tz';
import { TIMELINE_BUCKETS, type LearningRoomStats, type LearningSession } from '@/contracts';
import { consecutiveDays } from './activity-days';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from './time';

const MINUTE_MS = 60_000;
const BUCKET_MINUTES = 1440 / TIMELINE_BUCKETS;
const RECENT_WEEKS = 8;
const AVERAGE_WINDOW_DAYS = 30;

/** 0 (Monday) to 6 (Sunday) for a 'YYYY-MM-DD' date. */
export function mondayIndex(dateKey: string): number {
  const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** The Monday that starts the week containing `dateKey`. */
export function weekStartOf(dateKey: string): string {
  return shiftScheduledDate(dateKey, -mondayIndex(dateKey));
}

/** Intensity 0 to 4 for the activity heatmap, scaled to the busiest day of the year. */
export function heatLevel(minutes: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0 || max <= 0) return 0;
  const ratio = minutes / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface HeatCell {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
  /** False for the padding days before 1 January and after 31 December. */
  inYear: boolean;
  future: boolean;
}

export interface HeatWeek {
  cells: HeatCell[];
  /** Month name above the week that holds the 1st of that month. */
  monthLabel: string | null;
}

export interface YearHeatmap {
  weeks: HeatWeek[];
  max: number;
}

/** Monday-first weeks covering the whole year, one cell per day, for the activity heatmap. */
export function buildYearHeatmap(
  year: number,
  activity: { date: string; focusMinutes: number }[],
  today: string,
): YearHeatmap {
  const minutes = new Map(activity.map((day) => [day.date, day.focusMinutes]));
  const max = Math.max(0, ...activity.map((day) => day.focusMinutes));
  const first = `${year}-01-01`;
  const last = `${year}-12-31`;
  const weeks: HeatWeek[] = [];
  let start = weekStartOf(first);
  while (start <= last) {
    let monthLabel: string | null = null;
    const cells: HeatCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = shiftScheduledDate(start, day);
      const inYear = date >= first && date <= last;
      const value = inYear ? (minutes.get(date) ?? 0) : 0;
      if (inYear && date.endsWith('-01')) {
        monthLabel = MONTH_SHORT[Number(date.slice(5, 7)) - 1] ?? null;
      }
      cells.push({
        date,
        minutes: value,
        level: heatLevel(value, max),
        inYear,
        future: date > today,
      });
    }
    weeks.push({ cells, monthLabel });
    start = shiftScheduledDate(start, 7);
  }
  return { weeks, max };
}

/** 'HH:MM' at the start of a 15-minute slot, with 96 giving '24:00'. */
export function slotTime(slot: number): string {
  const total = slot * BUCKET_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** The busiest hour of the day in a month's timeline, or null when it holds no focus time. */
export function busiestHour(slots: number[]): { start: string; end: string } | null {
  const width = 60 / BUCKET_MINUTES;
  let best = -1;
  let bestSum = 0;
  for (let index = 0; index + width <= slots.length; index += 1) {
    let sum = 0;
    for (let offset = 0; offset < width; offset += 1) sum += slots[index + offset] ?? 0;
    // On a tie, prefer a window that starts on real focus time over one that starts on a gap.
    const startsOnFocus = (slots[index] ?? 0) > 0 && (slots[best] ?? 0) === 0;
    if (sum > bestSum || (sum === bestSum && sum > 0 && startsOnFocus)) {
      bestSum = sum;
      best = index;
    }
  }
  return best < 0 ? null : { start: slotTime(best), end: slotTime(best + width) };
}

interface Interval {
  startMs: number;
  endMs: number;
}

function focusIntervalsOf(session: LearningSession): Interval[] {
  // Old logbook entries on disk have no `focusIntervals` at all.
  const saved = (session.focusIntervals ?? [])
    .map((interval) => ({ startMs: Date.parse(interval.start), endMs: Date.parse(interval.end) }))
    .filter((interval) => Number.isFinite(interval.startMs) && interval.endMs > interval.startMs);
  if (saved.length > 0) return saved;
  // Sessions saved before block times were recorded: treat the focus time as one block.
  const startMs = Date.parse(session.startedAt);
  if (!Number.isFinite(startMs) || session.focusMinutes <= 0) return [];
  return [{ startMs, endMs: startMs + session.focusMinutes * MINUTE_MS }];
}

function addToTimeline(buckets: number[], interval: Interval, timeZone: string): void {
  const start = new TZDate(interval.startMs, timeZone);
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const length = (interval.endMs - interval.startMs) / MINUTE_MS;
  for (let offset = 0; offset < length; offset += 1) {
    const slot = Math.floor(((startMinute + offset) % 1440) / BUCKET_MINUTES);
    buckets[slot] = (buckets[slot] ?? 0) + Math.min(1, length - offset);
  }
}

/**
 * Statistics for the calendar year containing `now`. Sessions from other years are ignored, so
 * on 1 January everything starts again from zero without deleting the logbook.
 */
export function buildFocusStats(
  sessions: LearningSession[],
  now: Date,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): LearningRoomStats {
  const today = formatScheduledDate(now, timeZone);
  const year = Number(today.slice(0, 4));
  const counted = sessions.filter(
    (session) =>
      session.status === 'completed' &&
      Number(formatScheduledDate(session.startedAt, timeZone).slice(0, 4)) === year,
  );

  const perDay = new Map<string, number>();
  const months = Array.from({ length: 12 }, () => 0);
  const timeline = Array.from({ length: 12 }, () =>
    Array.from({ length: TIMELINE_BUCKETS }, () => 0),
  );

  for (const session of counted) {
    const date = formatScheduledDate(session.startedAt, timeZone);
    perDay.set(date, (perDay.get(date) ?? 0) + session.focusMinutes);
    const month = Number(date.slice(5, 7)) - 1;
    months[month] = (months[month] ?? 0) + session.focusMinutes;
    const buckets = timeline[month];
    if (!buckets) continue;
    for (const interval of focusIntervalsOf(session)) addToTimeline(buckets, interval, timeZone);
  }

  const minutesOn = (date: string) => perDay.get(date) ?? 0;
  const weekStart = weekStartOf(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = shiftScheduledDate(weekStart, index);
    return { date, focusMinutes: minutesOn(date) };
  });

  const firstDay = `${year}-01-01`;
  const recentWeeks = Array.from({ length: RECENT_WEEKS }, (_, index) => {
    const start = shiftScheduledDate(weekStart, -7 * (RECENT_WEEKS - 1 - index));
    let focusMinutes = 0;
    for (let day = 0; day < 7; day += 1) focusMinutes += minutesOn(shiftScheduledDate(start, day));
    return { weekStart: start, focusMinutes };
  }).filter((week) => shiftScheduledDate(week.weekStart, 6) >= firstDay);

  const windowStart = shiftScheduledDate(today, -(AVERAGE_WINDOW_DAYS - 1));
  const recent = counted.filter(
    (session) => formatScheduledDate(session.startedAt, timeZone) >= windowStart,
  );
  const averageSessionMinutes =
    recent.length === 0
      ? 0
      : recent.reduce((sum, session) => sum + session.focusMinutes, 0) / recent.length;

  const activity = [...perDay.entries()]
    .filter(([, focusMinutes]) => focusMinutes > 0)
    .map(([date, focusMinutes]) => ({ date, focusMinutes }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    year,
    todayFocusMinutes: minutesOn(today),
    weekFocusMinutes: weekDays.reduce((sum, day) => sum + day.focusMinutes, 0),
    averageSessionMinutes,
    streakDays: consecutiveDays(
      activity.map((day) => day.date),
      today,
    ),
    activity,
    weekDays,
    recentWeeks,
    months,
    timeline,
  };
}
