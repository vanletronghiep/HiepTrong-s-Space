'use client';

import { Check } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { TaskDto } from '@/contracts';
import { formatDayColumnHeader, getMonthCalendarCells } from '@/domain/date-input';
import { sortTasks } from '@/domain/task-sort';
import { deriveTaskState } from '@/domain/task-status';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import { Drawer } from '@/ui/Drawer';
import { EmptyState } from '@/ui/EmptyState';
import { StarIcon } from '@/ui/StarIcon';
import { cn } from '@/ui/cn';
import { DailyRingedPlanet } from './DailySky';
import { FinishedCounter } from './FinishedCounter';
import { TaskCard } from './TaskCard';
import styles from './month-view.module.css';

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const PRIORITIES = [
  { key: 'urgent', short: 'U' },
  { key: 'normal', short: 'N' },
  { key: 'optional', short: 'O' },
] as const;

export interface MonthViewProps {
  anchorDate: string;
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

export function MonthView({
  anchorDate,
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
}: MonthViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const closeDay = useCallback(() => setSelectedDate(null), []);
  const todayStr = formatScheduledDate(now, timeZone);

  const { cells, monthLabel } = useMemo(() => {
    const month = getMonthCalendarCells(anchorDate, timeZone);
    const lastDate = month.cells.at(-1)?.scheduledDate;
    if (!lastDate) return month;

    // The calendar always occupies six weeks, including days from the next month.
    const extraDays = Array.from({ length: 42 - month.cells.length }, (_, index) => {
      const scheduledDate = shiftScheduledDate(lastDate, index + 1, timeZone);
      return { scheduledDate, dayNumber: Number(scheduledDate.slice(-2)), inCurrentMonth: false };
    });
    return { ...month, cells: [...month.cells, ...extraDays] };
  }, [anchorDate, timeZone]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskDto[]>();
    for (const task of tasks) {
      if (!task.scheduledDate) continue;
      const bucket = map.get(task.scheduledDate) ?? [];
      bucket.push(task);
      map.set(task.scheduledDate, bucket);
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return sortTasks(tasksByDate.get(selectedDate) ?? []);
  }, [selectedDate, tasksByDate]);

  const selectedHeader = selectedDate ? formatDayColumnHeader(selectedDate, timeZone) : null;

  return (
    <div>
      <div className={cn(styles.grid, styles.weekdays)} aria-hidden="true">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <section key={monthLabel} className={styles.grid} aria-label={`${monthLabel} calendar`}>
        {cells.map((cell, index) => {
          const dayTasks = tasksByDate.get(cell.scheduledDate) ?? [];
          let completedCount = 0;
          const counts = { urgent: 0, normal: 0, optional: 0 };
          for (const task of dayTasks) {
            if (task.status === 'completed') completedCount += 1;
            counts[task.priority] += 1;
          }
          const priorities = PRIORITIES.filter(({ key }) => counts[key] > 0);
          const priorityLabel = priorities.map(({ key }) => `${counts[key]} ${key}`).join(', ');
          const hasOverdue = dayTasks.some((t) => deriveTaskState(t, now).isOverdue);
          const isToday = cell.scheduledDate === todayStr;

          return (
            <button
              key={cell.scheduledDate}
              type="button"
              onClick={() => setSelectedDate(cell.scheduledDate)}
              aria-current={isToday ? 'date' : undefined}
              aria-haspopup="dialog"
              aria-expanded={selectedDate === cell.scheduledDate}
              aria-label={`${cell.scheduledDate}, ${completedCount} of ${dayTasks.length} done${priorityLabel ? `, ${priorityLabel}` : ''}${hasOverdue ? ', overdue tasks' : ''}`}
              className={cn(
                styles.cell,
                !cell.inCurrentMonth && styles.adjacent,
                isToday && styles.today,
              )}
              style={{ animationDelay: `${Math.floor(index / 7) * 26 + (index % 7) * 8}ms` }}
            >
              <span className={styles.cellHeader} aria-hidden="true">
                <span>{cell.dayNumber}</span>
                {hasOverdue ? (
                  <span title="Contains overdue tasks" className={styles.overdue} />
                ) : null}
              </span>

              {dayTasks.length > 0 ? (
                <>
                  <span className={styles.priorities} aria-hidden="true">
                    {priorities.map(({ key, short }) => (
                      <span key={key} className={styles[key]} title={`${counts[key]} ${key}`}>
                        <span className={styles.priorityLong}>
                          {counts[key]} {key}
                        </span>
                        <span className={styles.priorityShort}>
                          {counts[key]}
                          {short}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className={styles.completion} aria-hidden="true">
                    <Check strokeWidth={1.7} />
                    <span title={`${completedCount} of ${dayTasks.length} done`}>
                      {completedCount}/{dayTasks.length}
                    </span>
                  </span>
                </>
              ) : null}
              <StarIcon size={12} className={styles.sparkle} />
            </button>
          );
        })}
      </section>

      <Drawer
        portal
        open={selectedDate !== null}
        onClose={closeDay}
        title={
          selectedHeader ? `${selectedHeader.weekday}, ${selectedHeader.dayMonth}` : 'Day tasks'
        }
      >
        <div className="space-y-4">
          <div className={styles.drawerHeading}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[length:var(--fs-small)] text-ws-text-muted">
                Manage tasks scheduled for this date
              </span>
              <FinishedCounter
                count={selectedDayTasks.filter((t) => t.status === 'completed').length}
              />
            </div>
            <DailyRingedPlanet className={styles.drawerPlanet} />
          </div>

          {selectedDayTasks.length === 0 ? (
            <EmptyState compact title="No tasks scheduled for this day." />
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {selectedDayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    now={now}
                    timeZone={timeZone}
                    context="daily"
                    isNew={recentlyCreatedId === task.id}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onScheduleDate={onScheduleDate}
                    onOpenPickDate={onOpenPickDate}
                    onOpenTransfer={onOpenTransfer}
                    onRequestDelete={onRequestDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
