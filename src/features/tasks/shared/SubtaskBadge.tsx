import type { Subtask } from '@/contracts';
import { countSubtasks } from '@/domain/subtask';
import { cn } from '@/ui/cn';
import brief from './task-brief.module.css';

const SIZE = 16;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Bottom-right "2/5" progress ring on a task card; hidden when the task has no subtasks.
 * `inline` places it in the normal flow (used at the left of the Overdue action row).
 */
export function SubtaskBadge({
  subtasks,
  inline = false,
}: {
  subtasks: readonly Subtask[] | undefined;
  inline?: boolean;
}) {
  const { done, total } = countSubtasks(subtasks);
  if (total === 0) return null;
  const complete = done === total;
  return (
    <span
      className={cn(brief.subBadge, inline && brief.subBadgeInline, complete && brief.subBadgeDone)}
      aria-label={`${done} of ${total} subtasks done`}
      title={`${done} of ${total} subtasks done`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - done / total)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span className="tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}
