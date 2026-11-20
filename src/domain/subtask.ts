import type { Priority, Subtask } from '@/contracts';

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, normal: 1, optional: 2 };

/** Open subtasks first, then by priority (urgent, normal, optional), then by creation time. */
export function sortSubtasks(subtasks: readonly Subtask[]): Subtask[] {
  return [...subtasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export function countSubtasks(subtasks: readonly Subtask[] | undefined): {
  done: number;
  total: number;
} {
  const list = subtasks ?? [];
  return { done: list.filter((item) => item.done).length, total: list.length };
}
