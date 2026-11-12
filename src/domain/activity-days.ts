import { shiftScheduledDate } from './time';

/** Consecutive checked local days; an unfinished today does not erase yesterday's streak. */
export function consecutiveDays(dates: string[], today: string): number {
  const completed = new Set(dates);
  let day = completed.has(today) ? today : shiftScheduledDate(today, -1);
  let count = 0;
  while (completed.has(day)) {
    count += 1;
    day = shiftScheduledDate(day, -1);
  }
  return count;
}
