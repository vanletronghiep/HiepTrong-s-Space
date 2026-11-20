import type { TaskRecord } from '@/contracts';
import { formatScheduledDate, shiftScheduledDate } from './time';

export interface CalendarDay {
  /** YYYY-MM-DD in the app time zone. */
  date: string;
  /** Tasks completed that day. */
  count: number;
}

export interface CompletionCalendar {
  /** One entry per week (Monday first); `null` marks days after today. */
  weeks: (CalendarDay | null)[][];
  /** Column index and short name of each month's first visible week. */
  months: { column: number; label: string }[];
  max: number;
  total: number;
  activeDays: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Monday = 0 ... Sunday = 6 for a YYYY-MM-DD calendar date. */
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * GitHub-style completion calendar: how many tasks were finished on each calendar day, built
 * only from real completion timestamps. The last column is the week containing today.
 */
export function computeCompletionCalendar(
  tasks: readonly Pick<TaskRecord, 'status' | 'completedAt'>[],
  todayKey: string,
  weekCount: number,
  timeZone: string,
): CompletionCalendar {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== 'completed' || !task.completedAt) continue;
    const day = formatScheduledDate(task.completedAt, timeZone);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const firstDay = shiftScheduledDate(
    todayKey,
    -(weekdayIndex(todayKey) + (weekCount - 1) * 7),
    timeZone,
  );

  const weeks: (CalendarDay | null)[][] = [];
  const months: CompletionCalendar['months'] = [];
  let max = 0;
  let total = 0;
  let activeDays = 0;
  let lastMonth = -1;
  let lastLabelColumn = -10;

  for (let column = 0; column < weekCount; column += 1) {
    const week: (CalendarDay | null)[] = [];
    for (let row = 0; row < 7; row += 1) {
      const date = shiftScheduledDate(firstDay, column * 7 + row, timeZone);
      if (date > todayKey) {
        week.push(null);
        continue;
      }
      const count = counts.get(date) ?? 0;
      week.push({ date, count });
      max = Math.max(max, count);
      total += count;
      if (count > 0) activeDays += 1;
    }
    const monday = week[0] ?? week.find(Boolean);
    const month = monday ? Number(monday.date.slice(5, 7)) - 1 : -1;
    if (month >= 0 && month !== lastMonth) {
      // A month that starts right after another label replaces it, so labels never crowd.
      if (column - lastLabelColumn < 3) months.pop();
      months.push({ column, label: MONTHS[month] ?? '' });
      lastLabelColumn = column;
    }
    if (month >= 0) lastMonth = month;
    weeks.push(week);
  }

  return { weeks, months, max, total, activeDays };
}

/** Intensity bucket 0 (none) to 4 for a day's count relative to the busiest day. */
export function activityLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4;
}
