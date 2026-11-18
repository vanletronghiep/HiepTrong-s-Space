'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowRightLeft, CalendarDays, CalendarMinus, CalendarPlus, Check } from 'lucide-react';
import type { TaskDto } from '@/contracts';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';

export interface ChooseDayMenuProps {
  task: TaskDto;
  isOverdue: boolean;
  now: Date;
  timeZone?: string;
  onScheduleDate: (task: TaskDto, scheduledDate: string | null) => void;
  onOpenPickDate: (task: TaskDto) => void;
  /** Overdue tasks transfer (day + deadline); `initialDate` preselects Today/Tomorrow. */
  onOpenTransfer: (task: TaskDto, initialDate?: string) => void;
}

/**
 * "Choose day" footer control for the task inspector (v3.2). Normal tasks move on the Daily
 * calendar; overdue tasks open the Transfer dialog so the deadline moves with the day.
 * Rendered inline (no portal) so it stays above the dialog's own layer.
 */
export function ChooseDayMenu({
  task,
  isOverdue,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  onScheduleDate,
  onOpenPickDate,
  onOpenTransfer,
}: ChooseDayMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const run = (fn: () => void) => () => {
    close(false);
    fn();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (event.key === 'Escape') {
      // preventDefault makes the dialog's focus trap leave this Escape to the menu.
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    if (items.length === 0) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(current + step + items.length) % items.length]?.focus({ preventScroll: true });
  };

  const pickDay = (date: string) =>
    isOverdue ? onOpenTransfer(task, date) : onScheduleDate(task, date);

  return (
    <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
      <Button
        ref={triggerRef}
        size="sm"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        leftIcon={<CalendarDays size={14} strokeWidth={1.5} />}
        onClick={() => setOpen((prev) => !prev)}
      >
        Choose day
      </Button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Choose day"
          className="absolute bottom-full left-0 z-10 mb-2 w-60 rounded-input border border-ws-border bg-ws-surface p-1.5 shadow-popover"
        >
          {isOverdue ? (
            <p className="px-3 pb-1 pt-1.5 text-[length:var(--fs-micro)] text-ws-text-muted">
              Moves the day and the deadline.
            </p>
          ) : null}
          <MenuItem
            icon={
              isOverdue ? (
                <ArrowRightLeft size={15} strokeWidth={1.5} />
              ) : (
                <CalendarPlus size={15} strokeWidth={1.5} />
              )
            }
            label="Today"
            current={!isOverdue && task.scheduledDate === todayStr}
            onClick={run(() => pickDay(todayStr))}
          />
          <MenuItem
            icon={
              isOverdue ? (
                <ArrowRightLeft size={15} strokeWidth={1.5} />
              ) : (
                <CalendarPlus size={15} strokeWidth={1.5} />
              )
            }
            label="Tomorrow"
            current={!isOverdue && task.scheduledDate === tomorrowStr}
            onClick={run(() => pickDay(tomorrowStr))}
          />
          <MenuItem
            icon={<CalendarDays size={15} strokeWidth={1.5} />}
            label="Specific date…"
            onClick={run(() => (isOverdue ? onOpenTransfer(task) : onOpenPickDate(task)))}
          />
          {task.scheduledDate !== null ? (
            <MenuItem
              icon={<CalendarMinus size={15} strokeWidth={1.5} />}
              label="Remove from Daily"
              onClick={run(() => onScheduleDate(task, null))}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  current = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  current?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-current={current ? 'true' : undefined}
      onClick={onClick}
      className={cn(
        'flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 text-left text-[length:var(--fs-ui)] text-ws-text transition-colors duration-[var(--dur-fast)] hover:bg-ws-accent-soft focus-visible:outline-2 focus-visible:outline-ws-focus motion-reduce:transition-none',
        current && 'bg-ws-accent-soft',
      )}
    >
      <span className="inline-flex shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {current ? <Check size={14} strokeWidth={1.75} aria-hidden="true" /> : null}
    </button>
  );
}
