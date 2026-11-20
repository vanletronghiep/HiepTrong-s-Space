'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  parseActiveTask,
  resolveActiveTask,
  type ActiveTaskState,
} from '@/domain/active-task';
import { getActiveTaskRaw, setActiveTaskRaw } from './preferences';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * The Daily "Active task" (v3.4): which task the user is focusing on, an optional estimate and
 * the focused time so far. Kept in this browser; stale state (task done or deleted, or past its
 * estimate after midnight) resolves to null.
 */
export function useActiveTask(
  tasks: readonly { id: string; status: 'active' | 'completed' }[],
  todayKey: string,
  nowMs: number,
) {
  const raw = useSyncExternalStore(subscribe, getActiveTaskRaw, () => null);
  const active = useMemo(
    () => resolveActiveTask(parseActiveTask(raw), tasks, todayKey, nowMs),
    [raw, tasks, todayKey, nowMs],
  );

  const write = useCallback((next: ActiveTaskState | null) => {
    setActiveTaskRaw(next ? JSON.stringify(next) : null);
    listeners.forEach((listener) => listener());
  }, []);

  return { active, write };
}
