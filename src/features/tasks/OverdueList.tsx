'use client';

import { useMemo } from 'react';
import { differenceInMilliseconds, parseISO } from 'date-fns';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { TaskDto } from '@/contracts';
import { deriveTaskState } from '@/domain/task-status';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { MOTION_EASE } from '@/design/motion';
import { Badge } from '@/ui/Badge';
import { EmptyState } from '@/ui/EmptyState';
import { TaskCard } from './TaskCard';
import styles from './daily-task-card.module.css';

export interface OverdueListProps {
  tasks: readonly TaskDto[];
  now: Date;
  timeZone?: string;
  recentlyCreatedId: string | null;
  onToggleComplete: (task: TaskDto) => void;
  onEdit: (task: TaskDto) => void;
  onScheduleDate: (task: TaskDto, scheduledDate: string | null) => void;
  onOpenPickDate: (task: TaskDto) => void;
  onOpenTransfer: (task: TaskDto) => void;
  onRequestDelete: (task: TaskDto) => void;
}

export function OverdueList({
  tasks,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  recentlyCreatedId,
  onToggleComplete,
  onEdit,
  onScheduleDate,
  onOpenPickDate,
  onOpenTransfer,
  onRequestDelete,
}: OverdueListProps) {
  const reducedMotion = useReducedMotion();
  const transition = { duration: reducedMotion ? 0 : 0.3, ease: MOTION_EASE };
  // §6.3: Overdue list = all active tasks with isOverdue, any date, sorted by deadline ascending (oldest first).
  const overdueTasks = useMemo(() => {
    return tasks
      .filter((task) => deriveTaskState(task, now).isOverdue)
      .sort((a, b) => differenceInMilliseconds(parseISO(a.deadlineAt), parseISO(b.deadlineAt)));
  }, [tasks, now]);

  return (
    <motion.section
      layout={reducedMotion ? false : 'position'}
      transition={transition}
      aria-labelledby="overdue-section-heading"
      className="pt-3 mt-2"
    >
      <div className={styles.overdueHeader}>
        <h2
          id="overdue-section-heading"
          className="font-display text-[length:var(--fs-h2)] leading-[var(--lh-heading)] font-medium text-ws-text"
        >
          Overdue
        </h2>
        <Badge tone={overdueTasks.length > 0 ? 'overdue' : 'count'} className="tabular-nums">
          {overdueTasks.length}
        </Badge>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {overdueTasks.length === 0 && (
            <motion.div
              key="overdue-empty"
              className="col-span-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <EmptyState compact title="Nothing overdue." />
            </motion.div>
          )}
          {overdueTasks.map((task) => (
            <motion.div
              key={task.id}
              layout={reducedMotion ? false : 'position'}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
              transition={transition}
            >
              <TaskCard
                task={task}
                now={now}
                timeZone={timeZone}
                context="overdue"
                isNew={recentlyCreatedId === task.id}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onScheduleDate={onScheduleDate}
                onOpenPickDate={onOpenPickDate}
                onOpenTransfer={onOpenTransfer}
                onRequestDelete={onRequestDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
