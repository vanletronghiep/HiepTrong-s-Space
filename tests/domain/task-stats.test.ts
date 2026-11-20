import { describe, expect, it } from 'vitest';
import { countSubtasks, sortSubtasks } from '@/domain/subtask';
import { computeTaskStats } from '@/domain/task-stats';

const TZ = 'Asia/Saigon';
// 2026-11-19 12:00 ICT
const NOW = Date.parse('2026-11-19T05:00:00.000Z');

function task(overrides: {
  scheduledDate: string;
  deadlineAt: string;
  completedAt?: string | null;
  transferCount?: number;
}) {
  return {
    status: overrides.completedAt ? ('completed' as const) : ('active' as const),
    scheduledDate: overrides.scheduledDate,
    deadlineAt: overrides.deadlineAt,
    completedAt: overrides.completedAt ?? null,
    transferCount: overrides.transferCount ?? 0,
  };
}

describe('computeTaskStats', () => {
  const tasks = [
    // finished on time, 09:00 ICT Wednesday 18 Nov (morning)
    task({
      scheduledDate: '2026-11-18',
      deadlineAt: '2026-11-18T14:00:00.000Z',
      completedAt: '2026-11-18T02:00:00.000Z',
    }),
    // finished late, 20:00 ICT Wednesday 18 Nov (evening)
    task({
      scheduledDate: '2026-11-18',
      deadlineAt: '2026-11-18T05:00:00.000Z',
      completedAt: '2026-11-18T13:00:00.000Z',
    }),
    // moved once, then finished on time Thursday 19 Nov 08:00 ICT
    task({
      scheduledDate: '2026-11-19',
      deadlineAt: '2026-11-19T14:00:00.000Z',
      completedAt: '2026-11-19T01:00:00.000Z',
      transferCount: 1,
    }),
    // overdue and never done
    task({ scheduledDate: '2026-11-17', deadlineAt: '2026-11-17T10:00:00.000Z' }),
    // still ahead of its deadline: not missed
    task({ scheduledDate: '2026-11-19', deadlineAt: '2026-11-19T16:00:00.000Z' }),
    // outside the 7-day range
    task({
      scheduledDate: '2026-11-01',
      deadlineAt: '2026-11-01T10:00:00.000Z',
      completedAt: '2026-11-01T03:00:00.000Z',
    }),
  ];

  const stats = computeTaskStats(tasks, '2026-11-19', 7, NOW, TZ);

  it('counts planned and finished per day inside the range only', () => {
    expect(stats.days).toHaveLength(7);
    expect(stats.planned).toBe(5);
    expect(stats.finished).toBe(3);
    expect(stats.completionRate).toBe(60);
    const wednesday = stats.days.find((day) => day.date === '2026-11-18');
    expect(wednesday).toEqual({ date: '2026-11-18', planned: 2, finished: 2 });
  });

  it('splits endings into on time, late, moved and missed', () => {
    expect(stats.endings).toEqual({ onTime: 1, late: 1, transferred: 1, missed: 1 });
    expect(stats.onTimeRate).toBe(67);
  });

  it('counts the streak back from today', () => {
    expect(stats.streak).toBe(2);
    expect(computeTaskStats([], '2026-11-19', 7, NOW, TZ).streak).toBe(0);
  });

  it('compares with the previous period', () => {
    const prev = computeTaskStats(tasks, '2026-11-19', 7, NOW, TZ);
    expect(prev.previousRate).toBeNull(); // 12 Nov back to 6 Nov holds no tasks
    const wide = computeTaskStats(tasks, '2026-11-19', 14, NOW, TZ);
    expect(wide.previousRate).toBe(100); // the 1 Nov task, finished
  });

  it('returns null rates when nothing was planned', () => {
    const empty = computeTaskStats([], '2026-11-19', 7, NOW, TZ);
    expect(empty.completionRate).toBeNull();
    expect(empty.onTimeRate).toBeNull();
  });
});

describe('subtask helpers', () => {
  const make = (
    id: string,
    priority: 'urgent' | 'normal' | 'optional',
    done: boolean,
    at: string,
  ) => ({
    id,
    title: id,
    priority,
    done,
    createdAt: at,
  });

  it('sorts open items by priority then age, and sinks done ones', () => {
    const sorted = sortSubtasks([
      make('done-urgent', 'urgent', true, '2026-11-19T01:00:00.000Z'),
      make('optional', 'optional', false, '2026-11-19T01:00:00.000Z'),
      make('normal-new', 'normal', false, '2026-11-19T03:00:00.000Z'),
      make('normal-old', 'normal', false, '2026-11-19T02:00:00.000Z'),
      make('urgent', 'urgent', false, '2026-11-19T04:00:00.000Z'),
    ]);
    expect(sorted.map((item) => item.id)).toEqual([
      'urgent',
      'normal-old',
      'normal-new',
      'optional',
      'done-urgent',
    ]);
  });

  it('counts done and total', () => {
    expect(countSubtasks(undefined)).toEqual({ done: 0, total: 0 });
    expect(
      countSubtasks([make('a', 'normal', true, 'x'), make('b', 'normal', false, 'x')]),
    ).toEqual({ done: 1, total: 2 });
  });
});
