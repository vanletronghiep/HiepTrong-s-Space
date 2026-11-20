import type { TaskRecord } from '@/contracts';
import { formatScheduledDate, shiftScheduledDate } from './time';

export type StatsRange = 7 | 14 | 30;

export interface DayStat {
  date: string;
  planned: number;
  finished: number;
}

export interface TaskEnding {
  onTime: number;
  late: number;
  transferred: number;
  missed: number;
}

export interface TaskStats {
  days: DayStat[];
  planned: number;
  finished: number;
  /** Share (0-100) of planned tasks that were finished; null when nothing was planned. */
  completionRate: number | null;
  /** Share (0-100) of finished tasks completed before their deadline; null when none finished. */
  onTimeRate: number | null;
  /** Completion rate of the previous period of the same length, for the trend arrow. */
  previousRate: number | null;
  streak: number;
  endings: TaskEnding;
}

type StatsTask = Pick<
  TaskRecord,
  'status' | 'deadlineAt' | 'scheduledDate' | 'completedAt' | 'transferCount'
>;

function planDay(task: StatsTask, timeZone: string): string {
  return task.scheduledDate ?? formatScheduledDate(task.deadlineAt, timeZone);
}

function rate(finished: number, planned: number): number | null {
  return planned === 0 ? null : Math.round((finished / planned) * 100);
}

/**
 * Observatory statistics (v3.4), derived from tasks the app already stores. A task belongs to
 * the day it was planned for (its Daily date, else its deadline day).
 */
export function computeTaskStats(
  tasks: readonly StatsTask[],
  todayKey: string,
  range: StatsRange,
  nowMs: number,
  timeZone: string,
): TaskStats {
  const dates = Array.from({ length: range }, (_, i) =>
    shiftScheduledDate(todayKey, i - (range - 1), timeZone),
  );
  const start = dates[0] ?? todayKey;
  const prevStart = shiftScheduledDate(start, -range, timeZone);

  const byDay = new Map<string, DayStat>(
    dates.map((date) => [date, { date, planned: 0, finished: 0 }]),
  );
  const endings: TaskEnding = { onTime: 0, late: 0, transferred: 0, missed: 0 };
  let onTimeFinished = 0;
  let prevPlanned = 0;
  let prevFinished = 0;
  const completionDays = new Set<string>();

  for (const task of tasks) {
    const day = planDay(task, timeZone);
    const done = task.status === 'completed' && task.completedAt !== null;

    if (done && task.completedAt) {
      completionDays.add(formatScheduledDate(task.completedAt, timeZone));
    }

    if (day >= prevStart && day < start) {
      prevPlanned += 1;
      if (done) prevFinished += 1;
    }

    const stat = byDay.get(day);
    if (!stat) continue;
    stat.planned += 1;
    if (done && task.completedAt) {
      stat.finished += 1;
      const completedMs = Date.parse(task.completedAt);
      const isLate = completedMs > Date.parse(task.deadlineAt);
      if ((task.transferCount ?? 0) > 0) endings.transferred += 1;
      else if (isLate) endings.late += 1;
      else endings.onTime += 1;
      if (!isLate) onTimeFinished += 1;
    } else if ((task.transferCount ?? 0) > 0) {
      endings.transferred += 1;
    } else if (Date.parse(task.deadlineAt) < nowMs) {
      endings.missed += 1;
    }
  }

  const days = dates.map((date) => byDay.get(date) ?? { date, planned: 0, finished: 0 });
  const planned = days.reduce((sum, day) => sum + day.planned, 0);
  const finished = days.reduce((sum, day) => sum + day.finished, 0);

  // Streak: consecutive days with a completion, counting back from today (or yesterday).
  let cursor = completionDays.has(todayKey) ? todayKey : shiftScheduledDate(todayKey, -1, timeZone);
  let streak = 0;
  while (completionDays.has(cursor)) {
    streak += 1;
    cursor = shiftScheduledDate(cursor, -1, timeZone);
  }

  return {
    days,
    planned,
    finished,
    completionRate: rate(finished, planned),
    onTimeRate: rate(onTimeFinished, finished),
    previousRate: rate(prevFinished, prevPlanned),
    streak,
    endings,
  };
}
