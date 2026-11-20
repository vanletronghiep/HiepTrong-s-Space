import { describe, expect, it } from 'vitest';
import {
  activeElapsedMs,
  createActiveTask,
  parseActiveTask,
  resolveActiveTask,
  setEstimate,
  sortActiveCandidates,
  toggleRunning,
} from '@/domain/active-task';

const MIN = 60_000;

describe('active task', () => {
  it('tracks focused time across pause and resume', () => {
    let state = createActiveTask('t1', '2026-11-19');
    state = toggleRunning(state, 0);
    expect(activeElapsedMs(state, 10 * MIN)).toBe(10 * MIN);
    state = toggleRunning(state, 10 * MIN);
    expect(activeElapsedMs(state, 50 * MIN)).toBe(10 * MIN);
    state = toggleRunning(state, 60 * MIN);
    expect(activeElapsedMs(state, 65 * MIN)).toBe(15 * MIN);
  });

  it('normalises the estimate and clears it for blank or invalid input', () => {
    const base = createActiveTask('t1', '2026-11-19');
    expect(setEstimate(base, 45.9).estimateMin).toBe(45);
    expect(setEstimate(base, 9999).estimateMin).toBe(600);
    expect(setEstimate(setEstimate(base, 30), null).estimateMin).toBeNull();
    expect(setEstimate(base, 0).estimateMin).toBeNull();
    expect(setEstimate(base, Number.NaN).estimateMin).toBeNull();
  });

  describe('resolveActiveTask', () => {
    const tasks = [
      { id: 't1', status: 'active' as const },
      { id: 't2', status: 'completed' as const },
    ];

    it('drops a missing or completed task', () => {
      expect(resolveActiveTask(createActiveTask('gone', 'd'), tasks, 'd', 0)).toBeNull();
      expect(resolveActiveTask(createActiveTask('t2', 'd'), tasks, 'd', 0)).toBeNull();
      expect(resolveActiveTask(null, tasks, 'd', 0)).toBeNull();
    });

    it('keeps the task the same day even when it ran past its estimate', () => {
      const state = {
        ...setEstimate(createActiveTask('t1', '2026-11-19'), 10),
        accumulatedMs: 99 * MIN,
      };
      expect(resolveActiveTask(state, tasks, '2026-11-19', 0)).toBe(state);
    });

    it('resets after midnight only when it ran past its estimate', () => {
      const over = {
        ...setEstimate(createActiveTask('t1', '2026-11-19'), 10),
        accumulatedMs: 11 * MIN,
      };
      expect(resolveActiveTask(over, tasks, '2026-11-20', 0)).toBeNull();

      const within = {
        ...setEstimate(createActiveTask('t1', '2026-11-19'), 10),
        accumulatedMs: 10 * MIN,
      };
      expect(resolveActiveTask(within, tasks, '2026-11-20', 0)).toBe(within);

      const noEstimate = { ...createActiveTask('t1', '2026-11-19'), accumulatedMs: 999 * MIN };
      expect(resolveActiveTask(noEstimate, tasks, '2026-11-20', 0)).toBe(noEstimate);
    });

    it('counts a run that is still going when deciding whether it is over the estimate', () => {
      const running = {
        ...setEstimate(createActiveTask('t1', '2026-11-19'), 10),
        runningSince: 0,
      };
      expect(resolveActiveTask(running, tasks, '2026-11-20', 11 * MIN)).toBeNull();
      expect(resolveActiveTask(running, tasks, '2026-11-20', 5 * MIN)).toBe(running);
    });
  });

  it('orders candidates by priority, then deadline, and skips completed tasks', () => {
    const make = (
      id: string,
      priority: 'urgent' | 'normal' | 'optional',
      deadlineAt: string,
      status: 'active' | 'completed' = 'active',
    ) => ({
      id,
      priority,
      deadlineAt,
      status,
    });
    const sorted = sortActiveCandidates([
      make('late-normal', 'normal', '2026-11-19T15:00:00.000Z'),
      make('optional', 'optional', '2026-11-19T01:00:00.000Z'),
      make('early-normal', 'normal', '2026-11-19T10:00:00.000Z'),
      make('urgent', 'urgent', '2026-11-19T20:00:00.000Z'),
      make('done', 'urgent', '2026-11-19T01:00:00.000Z', 'completed'),
    ]);
    expect(sorted.map((task) => task.id)).toEqual([
      'urgent',
      'early-normal',
      'late-normal',
      'optional',
    ]);
  });

  it('parses stored state defensively', () => {
    const state = createActiveTask('t1', '2026-11-19');
    expect(parseActiveTask(JSON.stringify(state))).toEqual(state);
    expect(parseActiveTask(null)).toBeNull();
    expect(parseActiveTask('not json')).toBeNull();
    expect(parseActiveTask('{"taskId":1}')).toBeNull();
  });
});
