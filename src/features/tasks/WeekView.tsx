'use client';

import { Flag } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import type { TaskDto } from '@/contracts';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { formatDayColumnHeader, getWeekDates } from '@/domain/date-input';
import { sortTasks } from '@/domain/task-sort';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { Drawer } from '@/ui/Drawer';
import { DailyRingedPlanet } from './DailySky';
import { DayEmpty } from './DayTaskList';
import { FinishedCounter } from './FinishedCounter';
import { TaskCard } from './TaskCard';
import styles from './week-view.module.css';

export interface WeekViewProps {
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

const priorities = ['urgent', 'normal', 'optional'] as const;
const emptyIllustrations = ['yesterday', 'tomorrow', 'today'] as const;

interface DaySummary {
  tasks: TaskDto[];
  done: number;
  due: number;
  counts: Record<TaskDto['priority'], number>;
}

function summarizeWeek(dates: readonly string[], tasks: readonly TaskDto[], timeZone: string) {
  const summaries = new Map(
    dates.map((date): [string, DaySummary] => [
      date,
      { tasks: [], done: 0, due: 0, counts: { urgent: 0, normal: 0, optional: 0 } },
    ]),
  );

  for (const task of tasks) {
    const scheduled = task.scheduledDate ? summaries.get(task.scheduledDate) : undefined;
    if (scheduled) {
      scheduled.tasks.push(task);
      scheduled.counts[task.priority] += 1;
      if (task.status === 'completed') scheduled.done += 1;
    }
    // A task can be scheduled to one date and due on another, or have no scheduled date at all.
    const deadlineDay = summaries.get(formatScheduledDate(task.deadlineAt, timeZone));
    if (deadlineDay) deadlineDay.due += 1;
  }

  return summaries;
}

function PriorityPlanet({ priority }: { priority: TaskDto['priority'] }) {
  return (
    <svg
      className={styles.planet}
      data-priority={priority}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6.2" fill="currentColor" />
      <path
        d="M8.1 9.6a4.7 4.7 0 0 1 5-2.1"
        stroke="var(--planet-light)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10.5"
        ry="3.1"
        transform="rotate(-28 12 12)"
        stroke="currentColor"
        strokeWidth="1.15"
      />
    </svg>
  );
}

function WeekProgress({ done, total, reduced }: { done: number; total: number; reduced: boolean }) {
  const percent = Math.round((done / total) * 100);
  return (
    <div className={styles.progress}>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <circle cx="28" cy="28" r="23" fill="none" stroke="var(--daily-pill)" strokeWidth="4" />
        <motion.circle
          cx="28"
          cy="28"
          r="23"
          fill="none"
          stroke="var(--daily-accent)"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          initial={false}
          animate={{ pathLength: percent / 100, opacity: percent ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : MOTION_DURATION.slow, ease: MOTION_EASE }}
        />
        <text x="28" y="29" textAnchor="middle" dominantBaseline="central">
          {percent}%
        </text>
      </svg>
      <span className={styles.done}>
        <strong>
          {done}/{total}
        </strong>
        <span>done</span>
      </span>
    </div>
  );
}

export function WeekView({
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
}: WeekViewProps) {
  const reduced = useReducedMotion();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weekDates = useMemo(() => getWeekDates(anchorDate, timeZone), [anchorDate, timeZone]);
  const today = formatScheduledDate(now, timeZone);
  const summaries = useMemo(
    () => summarizeWeek(weekDates, tasks, timeZone),
    [weekDates, tasks, timeZone],
  );
  const selectedSummary = selectedDate ? summaries.get(selectedDate) : undefined;
  const selectedTasks = useMemo(() => sortTasks(selectedSummary?.tasks ?? []), [selectedSummary]);
  const selectedHeader = selectedDate ? formatDayColumnHeader(selectedDate, timeZone) : null;
  const closeDay = useCallback(() => setSelectedDate(null), []);

  return (
    <>
      <div className={styles.grid} aria-label="Week task summaries" role="group">
        {weekDates.map((date, index) => {
          const day = summaries.get(date)!;
          const header = formatDayColumnHeader(date, timeZone);
          const isToday = date === today;
          const total = day.tasks.length;

          return (
            <motion.article
              key={date}
              className={styles.card}
              data-today={isToday}
              initial={reduced ? false : { opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0 : MOTION_DURATION.base,
                delay: reduced ? 0 : index * 0.035,
                ease: MOTION_EASE,
              }}
            >
              <header className={styles.header}>
                <span className={styles.date}>
                  <strong>{header.shortWeekday}</strong>
                  <span>{header.dayMonth}</span>
                </span>
                <svg
                  className={styles.constellation}
                  viewBox="0 0 35 21"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m3 15 9-9 9 7 11-10" stroke="currentColor" strokeDasharray="2 2" />
                  <g fill="currentColor">
                    <circle cx="3" cy="15" r="1.3" />
                    <circle cx="12" cy="6" r="1.3" />
                    <circle cx="21" cy="13" r="1.3" />
                    <circle cx="32" cy="3" r="1.3" />
                  </g>
                </svg>
              </header>

              {total > 0 ? (
                <>
                  <WeekProgress done={day.done} total={total} reduced={Boolean(reduced)} />
                  <ul className={styles.priorities}>
                    {priorities.map((priority) => (
                      <li key={priority}>
                        <PriorityPlanet priority={priority} />
                        <span>{priority}</span>
                        <strong>{day.counts[priority]}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className={styles.empty}>
                  <DayEmpty
                    compact
                    day={emptyIllustrations[index % emptyIllustrations.length] ?? 'today'}
                  />
                </div>
              )}

              <div className={styles.deadline}>
                <Flag size={13} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <strong>{day.due}</strong> due this day
                </span>
                <DailyRingedPlanet className={styles.ringDecoration} />
              </div>
              <button
                type="button"
                className={styles.trigger}
                aria-label={`Open ${header.weekday} ${header.dayMonth} tasks, ${day.done} of ${total} done, ${day.due} due this day`}
                aria-haspopup="dialog"
                aria-current={isToday ? 'date' : undefined}
                onClick={() => setSelectedDate(date)}
              />
            </motion.article>
          );
        })}
      </div>

      <Drawer
        portal
        open={selectedDate !== null}
        onClose={closeDay}
        title={
          selectedHeader ? `${selectedHeader.weekday}, ${selectedHeader.dayMonth}` : 'Day tasks'
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[length:var(--fs-small)] text-ws-text-muted">
              Manage tasks scheduled for this date
            </span>
            <FinishedCounter count={selectedSummary?.done ?? 0} />
          </div>
          {selectedTasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {selectedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    now={now}
                    timeZone={timeZone}
                    context="daily"
                    dense
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
          ) : (
            <DayEmpty day="today" compact />
          )}
        </div>
      </Drawer>
    </>
  );
}
