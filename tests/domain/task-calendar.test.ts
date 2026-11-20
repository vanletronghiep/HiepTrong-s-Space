import { describe, expect, it } from 'vitest';
import { activityLevel, computeCompletionCalendar } from '@/domain/task-calendar';

const TZ = 'Asia/Saigon';

function done(completedAt: string) {
  return { status: 'completed' as const, completedAt };
}

describe('computeCompletionCalendar', () => {
  // Thursday 19 Nov 2026
  const today = '2026-11-19';
  const tasks = [
    done('2026-11-19T02:00:00.000Z'), // Thu 19 Nov 09:00 ICT
    done('2026-11-19T05:00:00.000Z'), // Thu 19 Nov 12:00 ICT
    done('2026-11-16T01:00:00.000Z'), // Mon 16 Nov
    done('2026-11-18T17:30:00.000Z'), // 19 Nov 00:30 ICT, so it counts on the 19th
    done('2026-10-05T03:00:00.000Z'), // Mon 5 Oct
    { status: 'active' as const, completedAt: null },
    done('2025-01-01T03:00:00.000Z'), // far outside the window
  ];
  const calendar = computeCompletionCalendar(tasks, today, 8, TZ);

  it('lays out Monday-first weeks ending with the week of today', () => {
    expect(calendar.weeks).toHaveLength(8);
    const last = calendar.weeks[7]!;
    expect(last[0]?.date).toBe('2026-11-16');
    expect(last[3]?.date).toBe('2026-11-19');
    // Friday to Sunday of the current week have not happened yet.
    expect(last.slice(4)).toEqual([null, null, null]);
    expect(calendar.weeks[0]![0]?.date).toBe('2026-09-28');
  });

  it('counts completions per day in the app time zone from real timestamps', () => {
    const find = (date: string) => calendar.weeks.flat().find((day) => day?.date === date)?.count;
    expect(find('2026-11-19')).toBe(3);
    expect(find('2026-11-16')).toBe(1);
    expect(find('2026-10-05')).toBe(1);
    expect(find('2026-11-17')).toBe(0);
    expect(calendar.total).toBe(5);
    expect(calendar.activeDays).toBe(3);
    expect(calendar.max).toBe(3);
  });

  it('labels the first week of each month without crowding', () => {
    const labels = calendar.months.map((month) => month.label);
    // September starts one week before October, so only October is labelled.
    expect(labels).toEqual(['Oct', 'Nov']);
    const columns = calendar.months.map((month) => month.column);
    columns.slice(1).forEach((column, i) => expect(column - columns[i]!).toBeGreaterThanOrEqual(3));
  });

  it('is empty without any completions', () => {
    const empty = computeCompletionCalendar([], today, 4, TZ);
    expect(empty.total).toBe(0);
    expect(empty.activeDays).toBe(0);
    expect(empty.max).toBe(0);
  });
});

describe('activityLevel', () => {
  it('maps counts to five buckets relative to the busiest day', () => {
    expect(activityLevel(0, 8)).toBe(0);
    expect(activityLevel(1, 8)).toBe(1);
    expect(activityLevel(4, 8)).toBe(2);
    expect(activityLevel(6, 8)).toBe(3);
    expect(activityLevel(8, 8)).toBe(4);
    expect(activityLevel(3, 0)).toBe(0);
  });
});
