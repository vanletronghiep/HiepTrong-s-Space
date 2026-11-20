import type { Priority, TaskRecord } from '@/contracts';

/** The one task the user is focusing on right now, with an optional time estimate. */
export interface ActiveTaskState {
  taskId: string;
  /** Estimate in minutes; null when the user gave none. */
  estimateMin: number | null;
  /** Calendar day (YYYY-MM-DD) the task became active. */
  day: string;
  /** Focused time banked before the current run. */
  accumulatedMs: number;
  /** Epoch ms when the current run started; null while paused. */
  runningSince: number | null;
}

export const MAX_ESTIMATE_MIN = 600;

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, normal: 1, optional: 2 };

export function createActiveTask(taskId: string, day: string): ActiveTaskState {
  return { taskId, estimateMin: null, day, accumulatedMs: 0, runningSince: null };
}

export function activeElapsedMs(state: ActiveTaskState, nowMs: number): number {
  const running = state.runningSince === null ? 0 : Math.max(0, nowMs - state.runningSince);
  return state.accumulatedMs + running;
}

export function setEstimate(state: ActiveTaskState, minutes: number | null): ActiveTaskState {
  if (minutes === null || !Number.isFinite(minutes) || minutes < 1) {
    return { ...state, estimateMin: null };
  }
  return { ...state, estimateMin: Math.min(MAX_ESTIMATE_MIN, Math.floor(minutes)) };
}

export function toggleRunning(state: ActiveTaskState, nowMs: number): ActiveTaskState {
  if (state.runningSince === null) return { ...state, runningSince: nowMs };
  return { ...state, accumulatedMs: activeElapsedMs(state, nowMs), runningSince: null };
}

/**
 * Drops the active task when it is gone or completed, and, after midnight, when it ran past its
 * estimate. An active task without an estimate, or still within it, carries over to the new day.
 */
export function resolveActiveTask(
  state: ActiveTaskState | null,
  tasks: readonly Pick<TaskRecord, 'id' | 'status'>[],
  todayKey: string,
  nowMs: number,
): ActiveTaskState | null {
  if (!state) return null;
  const task = tasks.find((item) => item.id === state.taskId);
  if (!task || task.status === 'completed') return null;
  if (
    state.day < todayKey &&
    state.estimateMin !== null &&
    activeElapsedMs(state, nowMs) > state.estimateMin * 60_000
  ) {
    return null;
  }
  return state;
}

/** Open tasks to choose from: priority first, then the nearest deadline. */
export function sortActiveCandidates<
  T extends Pick<TaskRecord, 'status' | 'priority' | 'deadlineAt'>,
>(tasks: readonly T[]): T[] {
  return tasks
    .filter((task) => task.status === 'active')
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.deadlineAt.localeCompare(b.deadlineAt),
    );
}

export function parseActiveTask(raw: string | null): ActiveTaskState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ActiveTaskState> | null;
    if (
      !value ||
      typeof value.taskId !== 'string' ||
      typeof value.day !== 'string' ||
      typeof value.accumulatedMs !== 'number'
    ) {
      return null;
    }
    return {
      taskId: value.taskId,
      day: value.day,
      accumulatedMs: Math.max(0, value.accumulatedMs),
      estimateMin: typeof value.estimateMin === 'number' ? value.estimateMin : null,
      runningSince: typeof value.runningSince === 'number' ? value.runningSince : null,
    };
  } catch {
    return null;
  }
}
