'use client';

import { useCallback, useEffect, useRef, type Ref } from 'react';
import { ArrowRightLeft, Clock, Pin, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { TaskDto } from '@/contracts';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { formatDayColumnHeader } from '@/domain/date-input';
import { extractNotePlainText } from '@/domain/note-format';
import { deriveTaskState, formatTimeLeftLabel } from '@/domain/task-status';
import {
  DEFAULT_APP_TIMEZONE,
  formatDisplayDateTime,
  formatHubDeadline,
} from '@/domain/time';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { taskNoteTone } from './task-note-tone';
import noteStyles from './task-note.module.css';
import { cn } from '@/ui/cn';
import { DueSoonDot } from './DueSoonDot';
import { PriorityBadge } from './PriorityBadge';
import { TaskMenu } from './TaskMenu';
import dailyStyles from './daily-task-card.module.css';
import brief from './task-brief.module.css';

const PRIORITY_LABELS: Record<TaskDto['priority'], string> = {
  urgent: 'Urgent',
  normal: 'Normal',
  optional: 'Optional',
};

export interface TaskCardProps {
  ref?: Ref<HTMLElement>;
  task: TaskDto;
  now: Date;
  timeZone?: string;
  context?: 'daily' | 'overdue' | 'hub';
  dense?: boolean;
  carousel?: boolean;
  isNew?: boolean;
  isHighlighted?: boolean;
  onInspect?: (task: TaskDto) => void;
  onToggleComplete: (task: TaskDto) => void;
  onEdit: (task: TaskDto) => void;
  onScheduleDate: (task: TaskDto, scheduledDate: string | null) => void;
  onOpenPickDate: (task: TaskDto) => void;
  onOpenTransfer: (task: TaskDto) => void;
  onRequestDelete: (task: TaskDto) => void;
}

export function TaskCard({
  ref,
  task,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  context = 'daily',
  dense = false,
  carousel = false,
  isNew = false,
  isHighlighted = false,
  onInspect,
  onToggleComplete,
  onEdit,
  onScheduleDate,
  onOpenPickDate,
  onOpenTransfer,
  onRequestDelete,
}: TaskCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const setCardRef = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
      if (typeof ref === 'function') {
        return ref(node);
      }
      if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const derived = deriveTaskState(task, now);
  const isCompleted = task.status === 'completed';
  const plainDescription = extractNotePlainText(task.description);
  const hasDescription = plainDescription.length > 0;

  useEffect(() => {
    if ((isNew || isHighlighted) && cardRef.current) {
      cardRef.current.scrollIntoView?.({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  }, [isNew, isHighlighted, reducedMotion]);

  const deadlineDisplay =
    context === 'hub'
      ? formatHubDeadline(task.deadlineAt, timeZone)
      : formatDisplayDateTime(task.deadlineAt, now, timeZone);
  const scheduledHeader = task.scheduledDate
    ? formatDayColumnHeader(task.scheduledDate, timeZone)
    : null;

  const timeStatus = !isCompleted ? (
    derived.isOverdue ? (
      <span className="inline-flex items-center gap-1 font-medium text-text-overdue tabular-nums">
        <Clock size={13} strokeWidth={1.5} className="shrink-0" />
        <span>{formatTimeLeftLabel(derived.timeLeftMs, true)}</span>
      </span>
    ) : (
      <span className="text-ws-text-muted tabular-nums">
        {context === 'hub'
          ? formatTimeLeftLabel(derived.timeLeftMs, false)
          : `· ${formatTimeLeftLabel(derived.timeLeftMs, false)}`}
      </span>
    )
  ) : null;

  const deadline = (
    <>
      <span className="tabular-nums text-ws-text-muted">{deadlineDisplay}</span>
      {timeStatus}
    </>
  );

  const handleInspect = onInspect ? () => onInspect(task) : undefined;
  const cardDomId = `task-card-${context}${carousel ? '-carousel' : ''}-${task.id}`;

  const titleNode = handleInspect ? (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(e) => {
        e.stopPropagation();
        handleInspect();
      }}
      className={cn(
        'w-full text-left bg-transparent border-0 p-0 font-inherit text-inherit leading-[inherit] cursor-pointer rounded-sm',
        (carousel || context === 'hub') && 'block truncate',
      )}
    >
      {task.title}
    </button>
  ) : (
    task.title
  );

  const checkboxNode = (
    <div className={brief.check}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggleComplete(task)}
        aria-label={isCompleted ? `Mark ${task.title} as active` : `Complete ${task.title}`}
      />
    </div>
  );

  const menuNode = (
    <div className={brief.menu}>
      <TaskMenu
        task={task}
        isOverdue={derived.isOverdue}
        now={now}
        timeZone={timeZone}
        context={context}
        portal={carousel || context === 'hub'}
        onEdit={onEdit}
        onScheduleDate={onScheduleDate}
        onOpenPickDate={onOpenPickDate}
        onOpenTransfer={onOpenTransfer}
        onRequestDelete={onRequestDelete}
      />
    </div>
  );

  const descriptionNode = hasDescription ? (
    <p
      title={carousel || context === 'hub' ? plainDescription : undefined}
      className={cn(brief.desc, isCompleted ? 'text-text-completed' : 'text-ws-text-muted')}
    >
      {plainDescription}
    </p>
  ) : null;

  return (
    <motion.article
      ref={setCardRef}
      id={cardDomId}
      data-task-id={task.id}
      data-note-tone={context === 'hub' ? taskNoteTone(task.id) : undefined}
      layout={reducedMotion ? false : 'position'}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: isCompleted && context !== 'hub' ? 0.72 : 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{
        duration: reducedMotion ? 0 : MOTION_DURATION.layout,
        ease: MOTION_EASE,
      }}
      onClick={
        handleInspect
          ? (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest(
                  'button, a, input, select, textarea, [role="checkbox"], [role="menuitem"]',
                )
              ) {
                return;
              }
              handleInspect();
            }
          : undefined
      }
      onKeyDown={
        handleInspect
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleInspect();
              }
            }
          : undefined
      }
      className={cn(
        'group/card relative flex flex-col rounded-task border select-none',
        brief.anatomy,
        handleInspect && 'cursor-pointer',
        carousel ? dailyStyles.compact : dense ? 'p-3.5 gap-2' : 'px-[18px] py-4 gap-2.5',
        'transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--ease)] motion-reduce:transition-none motion-reduce:duration-0',
        context === 'overdue' && dailyStyles.overdue,
        derived.isOverdue
          ? 'bg-tint-overdue-bg border-tint-overdue-border'
          : task.pinned && !isCompleted
            ? 'bg-ws-surface border-ws-accent-soft'
            : task.priority === 'urgent' && !isCompleted
              ? 'bg-ws-surface border-[color-mix(in_srgb,var(--status-overdue)_20%,var(--ws-border))]'
              : 'bg-ws-surface border-ws-border',
        isCompleted
          ? 'shadow-none'
          : 'shadow-task hover:shadow-task-hover hover:border-[color-mix(in_srgb,var(--ws-accent)_45%,var(--ws-border))]',
        context === 'hub' && noteStyles.note,
        context === 'hub' && derived.isOverdue && noteStyles.noteOverdue,
        isNew && 'animate-task-new-glow',
        isHighlighted && 'animate-task-highlight-glow',
      )}
    >
      {context === 'hub' ? (
        <>
          <span
            className={cn(
              noteStyles.tape,
              noteStyles[`tape-${task.priority}`],
              isCompleted && noteStyles.tapeDone,
            )}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          <div className={cn(noteStyles.noteHeader, brief.header)}>
            {checkboxNode}
            <h3
              title={task.title}
              className={cn(
                brief.title,
                brief.titleSingle,
                'font-semibold',
                isCompleted
                  ? 'italic line-through decoration-text-completed decoration-1 text-text-completed font-normal'
                  : 'text-ws-text',
              )}
            >
              {titleNode}
            </h3>
            {menuNode}
          </div>

          {hasDescription ? (
            <div className={cn(noteStyles.descriptionSlot, brief.descSlot)}>{descriptionNode}</div>
          ) : null}

          <div className={noteStyles.metadata}>
            <div className="flex flex-wrap items-center gap-1.5">
              {task.pinned ? (
                <span
                  aria-label="Pinned to top of day"
                  title="Pinned"
                  className="inline-flex items-center text-text-accent"
                >
                  <Pin size={14} strokeWidth={1.5} />
                </span>
              ) : null}
              {scheduledHeader ? (
                <Badge tone="general">Scheduled {scheduledHeader.dayMonth}</Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {derived.isDueSoon ? <DueSoonDot /> : null}
              {deadline}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={brief.header}>
            {checkboxNode}
            <h3
              title={carousel ? task.title : undefined}
              className={cn(
                brief.title,
                carousel ? brief.titleSingle : brief.titleDouble,
                'font-semibold',
                isCompleted
                  ? 'italic line-through decoration-text-completed decoration-1 text-text-completed font-normal'
                  : 'text-ws-text',
              )}
            >
              {titleNode}
            </h3>
            {menuNode}
          </div>

          <div
            className={cn(
              brief.indent,
              'flex flex-col',
              carousel ? dailyStyles.compactBody : dense ? 'gap-1.5' : 'gap-2',
            )}
          >
            {carousel ? <div className={brief.descSlot}>{descriptionNode}</div> : descriptionNode}

            <div
              className={cn(
                brief.meta,
                'flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[length:var(--fs-small)]',
                carousel && dailyStyles.compactMetadata,
              )}
            >
              <PriorityBadge priority={task.priority} />
              {task.pinned ? (
                <span
                  aria-label="Pinned to top of day"
                  title="Pinned"
                  className="inline-flex items-center text-text-accent"
                >
                  <Pin size={14} strokeWidth={1.5} />
                </span>
              ) : null}
              {carousel && derived.isDueSoon ? <DueSoonDot /> : null}
              {carousel ? (
                <span className={dailyStyles.compactDeadline}>{deadline}</span>
              ) : (
                deadline
              )}
              {!carousel && derived.isDueSoon ? <DueSoonDot /> : null}
            </div>

            {context === 'overdue' ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="pt-2 mt-0.5 border-t border-tint-overdue-border flex flex-wrap items-center justify-end gap-2"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<ArrowRightLeft size={14} strokeWidth={1.5} />}
                  onClick={() => onOpenTransfer(task)}
                >
                  Transfer
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  leftIcon={<Trash2 size={14} strokeWidth={1.5} />}
                  onClick={() => onRequestDelete(task)}
                >
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </motion.article>
  );
}
