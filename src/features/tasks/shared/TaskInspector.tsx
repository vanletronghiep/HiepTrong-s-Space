'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CalendarDays, Clock, Pin } from 'lucide-react';
import type { TaskDto } from '@/contracts';
import { deriveTaskState, formatTimeLeftLabel } from '@/domain/task-status';
import {
  DEFAULT_APP_TIMEZONE,
  formatInspectorDeadline,
  formatScheduledDateWithYear,
} from '@/domain/time';
import { Badge, type BadgeTone } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { cn } from '@/ui/cn';
import { ChooseDayMenu } from './ChooseDayMenu';
import { DueSoonDot } from './DueSoonDot';
import { PriorityBadge } from './PriorityBadge';

export interface TaskInspectorProps {
  task: TaskDto | null;
  open: boolean;
  onClose: () => void;
  now: Date;
  timeZone?: string;
  onToggleComplete: (task: TaskDto) => void;
  onEdit: (task: TaskDto) => void;
  onScheduleDate: (task: TaskDto, scheduledDate: string | null) => void;
  onOpenPickDate: (task: TaskDto) => void;
  onOpenTransfer: (task: TaskDto, initialDate?: string) => void;
  onRequestDelete: (task: TaskDto) => void;
  portal?: boolean;
}

export function TaskInspector({
  task,
  open,
  onClose,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  onToggleComplete,
  onEdit,
  onScheduleDate,
  onOpenPickDate,
  onOpenTransfer,
  onRequestDelete,
  portal = true,
}: TaskInspectorProps) {
  const [cachedTask, setCachedTask] = useState<TaskDto | null>(task);

  useEffect(() => {
    if (task) {
      setCachedTask(task);
    }
  }, [task]);

  const currentTask = task ?? cachedTask;
  const isOpen = open && task !== null;

  if (!currentTask) {
    return null;
  }

  const derived = deriveTaskState(currentTask, now);
  const isCompleted = currentTask.status === 'completed';
  // Active tasks carry no status badge (v3.2); only Completed / Overdue / Due soon are shown.
  let statusLabel: string | null = null;
  let statusTone: BadgeTone = 'normal';
  if (isCompleted) {
    statusLabel = 'Completed';
    statusTone = 'completed';
  } else if (derived.isOverdue) {
    statusLabel = 'Overdue';
    statusTone = 'overdue';
  } else if (derived.isDueSoon) {
    statusLabel = 'Due soon';
    statusTone = 'due-soon';
  }

  const deadlineDisplay = formatInspectorDeadline(currentTask.deadlineAt, timeZone);
  const scheduledDisplay = currentTask.scheduledDate
    ? formatScheduledDateWithYear(currentTask.scheduledDate, timeZone)
    : 'Not scheduled on Daily';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={currentTask.title}
      portal={portal}
      className="w-[calc(100%-24px)] max-w-none sm:w-[min(75vw,960px)] max-h-[88dvh] overflow-y-auto"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onToggleComplete(currentTask)}
            >
              {isCompleted ? 'Mark active' : 'Mark complete'}
            </Button>
            <ChooseDayMenu
              task={currentTask}
              isOverdue={derived.isOverdue}
              now={now}
              timeZone={timeZone}
              onScheduleDate={onScheduleDate}
              onOpenPickDate={onOpenPickDate}
              onOpenTransfer={onOpenTransfer}
            />
            <Button size="sm" variant="secondary" onClick={() => onEdit(currentTask)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRequestDelete(currentTask)}
            >
              Delete
            </Button>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={currentTask.priority} />
          {statusLabel ? (
            <Badge tone={statusTone} withDot>
              {statusLabel}
            </Badge>
          ) : null}
          {currentTask.pinned ? (
            <Badge tone="general">
              <Pin size={12} strokeWidth={1.5} />
              <span>Pinned</span>
            </Badge>
          ) : null}
        </div>

        {/* Formatted description */}
        <div className="rounded-input border border-ws-border bg-ws-bg px-3.5 py-2.5">
          <FormattedNoteContent
            value={currentTask.description}
            emptyFallback="No description added."
          />
        </div>

        {/* Complete deadline and Daily schedule metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-input border border-ws-border bg-ws-surface px-3.5 py-3 text-[length:var(--fs-small)]">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
              <CalendarClock size={14} strokeWidth={1.5} className="shrink-0" />
              <span>Deadline</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ws-text tabular-nums">{deadlineDisplay}</span>
              {!isCompleted ? (
                derived.isOverdue ? (
                  <span className="inline-flex items-center gap-1 font-medium text-text-overdue tabular-nums">
                    <Clock size={13} strokeWidth={1.5} className="shrink-0" />
                    <span>{formatTimeLeftLabel(derived.timeLeftMs, true)}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-ws-text-muted tabular-nums">
                    {derived.isDueSoon ? <DueSoonDot /> : null}
                    <span>{formatTimeLeftLabel(derived.timeLeftMs, false)}</span>
                  </span>
                )
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
              <CalendarDays size={14} strokeWidth={1.5} className="shrink-0" />
              <span>Daily schedule</span>
            </span>
            <p
              className={cn(
                'font-medium tabular-nums',
                currentTask.scheduledDate ? 'text-ws-text' : 'text-ws-text-muted',
              )}
            >
              {scheduledDisplay}
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
