import { describe, expect, it } from 'vitest';
import type { LearningSession } from '@/contracts/learning-room';
import {
  buildFocusStats,
  buildYearHeatmap,
  busiestHour,
  heatLevel,
  weekStartOf,
} from '@/domain/focus-stats';

function session(overrides: Partial<LearningSession>): LearningSession {
  return {
    id: 'lr-1',
    title: 'Study',
    mode: 'pomodoro',
    targetSubject: 'General',
    relatedProjectId: null,
    relatedTaskId: null,
    startedAt: '2026-11-18T02:00:00.000Z',
    completedAt: '2026-11-18T03:00:00.000Z',
    durationMinutes: 60,
    focusMinutes: 50,
    breakMinutes: 10,
    pausedMinutes: 0,
    status: 'completed',
    reflectionNotes: '',
    rating: 4,
    focusIntervals: [],
    ...overrides,
  };
}

// 2026-11-20 is a Friday. Asia/Saigon is UTC+7, so 02:00Z is 09:00 local.
const NOW = new Date('2026-11-20T05:00:00.000Z');

describe('weekStartOf', () => {
  it('returns the Monday of the week', () => {
    expect(weekStartOf('2026-11-20')).toBe('2026-11-16');
    expect(weekStartOf('2026-11-16')).toBe('2026-11-16');
    expect(weekStartOf('2026-11-22')).toBe('2026-11-16');
  });
});

describe('buildFocusStats', () => {
  it('reports today, this week, the 30 day average and the streak', () => {
    const stats = buildFocusStats(
      [
        session({ id: 'a', startedAt: '2026-11-20T02:00:00.000Z', focusMinutes: 40 }),
        session({ id: 'b', startedAt: '2026-11-19T02:00:00.000Z', focusMinutes: 20 }),
        session({ id: 'c', startedAt: '2026-11-15T02:00:00.000Z', focusMinutes: 60 }),
        session({ id: 'd', startedAt: '2026-09-01T02:00:00.000Z', focusMinutes: 90 }),
      ],
      NOW,
    );
    expect(stats.year).toBe(2026);
    expect(stats.todayFocusMinutes).toBe(40);
    // Monday 16 to Sunday 22: the 15th falls in the previous week.
    expect(stats.weekFocusMinutes).toBe(60);
    expect(stats.weekDays.map((day) => day.date)[0]).toBe('2026-11-16');
    expect(stats.weekDays[3]?.focusMinutes).toBe(20);
    expect(stats.weekDays[4]?.focusMinutes).toBe(40);
    // Last 30 days include a, b and c but not the September session.
    expect(stats.averageSessionMinutes).toBeCloseTo(40);
    expect(stats.streakDays).toBe(2);
    expect(stats.months[10]).toBe(120);
    expect(stats.months[8]).toBe(90);
  });

  it('starts every calendar year from zero', () => {
    const stats = buildFocusStats(
      [session({ startedAt: '2025-12-31T02:00:00.000Z', focusMinutes: 120 })],
      new Date('2026-01-01T05:00:00.000Z'),
    );
    expect(stats.year).toBe(2026);
    expect(stats.activity).toEqual([]);
    expect(stats.streakDays).toBe(0);
    expect(stats.months.every((minutes) => minutes === 0)).toBe(true);
    expect(stats.timeline.every((month) => month.every((slot) => slot === 0))).toBe(true);
    expect(stats.averageSessionMinutes).toBe(0);
  });

  it('ignores sessions that were not completed', () => {
    const stats = buildFocusStats([session({ status: 'abandoned' })], NOW);
    expect(stats.activity).toEqual([]);
  });

  it('spreads real focus blocks across the 15 minute slots of their month', () => {
    const stats = buildFocusStats(
      [
        session({
          focusIntervals: [
            // 09:00 to 09:30 local
            { start: '2026-11-18T02:00:00.000Z', end: '2026-11-18T02:30:00.000Z' },
            // 23:50 to 00:10 local: wraps over midnight
            { start: '2026-11-18T16:50:00.000Z', end: '2026-11-18T17:10:00.000Z' },
          ],
        }),
      ],
      NOW,
    );
    const november = stats.timeline[10] ?? [];
    expect(november[36]).toBe(15);
    expect(november[37]).toBe(15);
    expect(november[95]).toBe(10);
    expect(november[0]).toBe(10);
    expect(stats.timeline[9]?.every((slot) => slot === 0)).toBe(true);
  });

  it('treats a session saved without block times as one block from its start', () => {
    const stats = buildFocusStats([session({ focusMinutes: 30, focusIntervals: [] })], NOW);
    const november = stats.timeline[10] ?? [];
    expect(november[36]).toBe(15);
    expect(november[37]).toBe(15);
  });

  it('reads logbook entries saved before block times existed', () => {
    const legacy = session({ focusMinutes: 30 }) as Partial<LearningSession>;
    delete legacy.focusIntervals;
    const stats = buildFocusStats([legacy as LearningSession], NOW);
    expect(stats.timeline[10]?.[36]).toBe(15);
  });

  it('only keeps the recent weeks that touch the year', () => {
    const stats = buildFocusStats([], new Date('2026-01-14T05:00:00.000Z'));
    // Weeks starting Dec 29, Jan 5 and Jan 12 touch 2026; Dec 22 and earlier do not.
    expect(stats.recentWeeks.map((week) => week.weekStart)).toEqual([
      '2025-12-29',
      '2026-01-05',
      '2026-01-12',
    ]);
  });
});

describe('heatLevel', () => {
  it('scales to the busiest day in four steps', () => {
    expect(heatLevel(0, 100)).toBe(0);
    expect(heatLevel(10, 100)).toBe(1);
    expect(heatLevel(40, 100)).toBe(2);
    expect(heatLevel(60, 100)).toBe(3);
    expect(heatLevel(100, 100)).toBe(4);
    expect(heatLevel(5, 0)).toBe(0);
  });
});

describe('buildYearHeatmap', () => {
  it('lays the year out in Monday-first weeks with padding outside the year', () => {
    const map = buildYearHeatmap(2026, [{ date: '2026-01-05', focusMinutes: 50 }], '2026-11-20');
    // 1 January 2026 is a Thursday, so the first week pads Monday to Wednesday.
    expect(map.weeks[0]?.cells.slice(0, 3).every((cell) => !cell.inYear)).toBe(true);
    expect(map.weeks[0]?.cells[3]?.date).toBe('2026-01-01');
    expect(map.weeks[0]?.monthLabel).toBe('Jan');
    expect(map.weeks[1]?.cells[0]).toMatchObject({ date: '2026-01-05', level: 4, minutes: 50 });
    expect(map.max).toBe(50);
    const all = map.weeks.flatMap((week) => week.cells).filter((cell) => cell.inYear);
    expect(all).toHaveLength(365);
    expect(all.filter((cell) => cell.future).length).toBeGreaterThan(0);
  });
});

describe('busiestHour', () => {
  it('finds the best hour and reports nothing for an empty month', () => {
    const slots = Array.from({ length: 96 }, () => 0);
    slots[38] = 10;
    slots[39] = 10;
    slots[40] = 5;
    // The hours starting at slots 37 and 38 tie; the one that starts on real focus time wins.
    expect(busiestHour(slots)).toEqual({ start: '09:30', end: '10:30' });
    expect(busiestHour(Array.from({ length: 96 }, () => 0))).toBeNull();
  });
});
