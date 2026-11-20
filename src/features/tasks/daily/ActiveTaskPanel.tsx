'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Check, Pause, Play, Plus, X } from 'lucide-react';
import type { TaskDto } from '@/contracts';
import { useActiveTask } from '@/client/use-active-task';
import {
  activeElapsedMs,
  createActiveTask,
  MAX_ESTIMATE_MIN,
  setEstimate,
  sortActiveCandidates,
  toggleRunning,
} from '@/domain/active-task';
import { formatDisplayDateTime } from '@/domain/time';
import { StarIcon } from '@/ui/StarIcon';
import { cn } from '@/ui/cn';
import styles from './daily-foundation.module.css';

const RING = 48;
const STROKE = 3;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DOT: Record<TaskDto['priority'], string> = {
  urgent: 'bg-[var(--daily-planet-urgent)]',
  normal: 'bg-[var(--daily-planet-normal)]',
  optional: 'bg-[var(--daily-planet-optional)]',
};

export interface ActiveTaskPanelProps {
  /** Tasks scheduled on today's Daily board. */
  tasks: readonly TaskDto[];
  todayKey: string;
  now: Date;
  timeZone: string;
  /** Marks the task done (the same action as its checkbox). */
  onCompleteTask?: (task: TaskDto) => void;
}

/**
 * "Active task" dashboard card (v3.4): choose the one task you are on right now from today's
 * list. The small circle holds the focus duration in minutes; pressing Start fills its border
 * as time passes, and the ring changes colour once the duration is exceeded.
 */
export function ActiveTaskPanel({
  tasks,
  todayKey,
  now,
  timeZone,
  onCompleteTask,
}: ActiveTaskPanelProps) {
  const nowMs = now.getTime();
  const { active, write } = useActiveTask(tasks, todayKey, nowMs);
  const [open, setOpen] = useState(false);
  const [liveMs, setLiveMs] = useState(0);
  const [pickerPos, setPickerPos] = useState({ left: 14, top: 60, width: 340 });
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const running = active?.runningSince != null;

  // While a run is going, tick every second so the ring fills smoothly.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLiveMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const candidates = useMemo(() => sortActiveCandidates(tasks), [tasks]);
  const task = active ? tasks.find((item) => item.id === active.taskId) : undefined;
  const estimate = active?.estimateMin ?? null;
  const elapsedMs = active ? activeElapsedMs(active, running ? Math.max(liveMs, nowMs) : nowMs) : 0;
  const progress = estimate ? Math.min(1, elapsedMs / (estimate * 60_000)) : 0;
  const over = estimate !== null && elapsedMs > estimate * 60_000;

  // The picker is a plain dropdown inside the card (scrolls with the page, never fixed).
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target) || titleRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      titleRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Opens the list right where the user clicked, kept inside the viewport. It stays a normal
  // object inside the card, so it scrolls with the page.
  const openPicker = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (open) {
      setOpen(false);
      return;
    }
    const section = sectionRef.current;
    if (section) {
      const box = section.getBoundingClientRect();
      const button = event.currentTarget.getBoundingClientRect();
      const fromKeyboard = event.clientX === 0 && event.clientY === 0;
      const x = fromKeyboard ? button.left + button.width / 2 : event.clientX;
      const y = fromKeyboard ? button.top + button.height / 2 : event.clientY;
      const width = Math.min(340, window.innerWidth - 16);
      const left = Math.min(Math.max(x - width / 2, 8), window.innerWidth - width - 8);
      setPickerPos({ left: left - box.left, top: y - box.top + 14, width });
    }
    setOpen(true);
  };

  const choose = (id: string) => {
    if (!active || active.taskId !== id) write(createActiveTask(id, todayKey));
    setOpen(false);
    titleRef.current?.focus({ preventScroll: true });
  };

  return (
    <section
      ref={sectionRef}
      className={styles.forecast}
      aria-label="Active task"
      style={open ? { zIndex: 20 } : undefined}
    >
      <span className={styles.forecastStar}>
        {active && task ? (
          <>
            {estimate ? (
              <svg className={styles.activeRing} viewBox={`0 0 ${RING} ${RING}`} aria-hidden="true">
                <circle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={RADIUS}
                  fill="none"
                  className={styles.activeTrack}
                  strokeWidth={STROKE}
                />
                <circle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={RADIUS}
                  fill="none"
                  className={cn(styles.activeArc, over && styles.activeArcOver)}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                />
              </svg>
            ) : null}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_ESTIMATE_MIN}
              value={active.estimateMin ?? ''}
              onChange={(event) =>
                write(
                  setEstimate(
                    active,
                    event.target.value === '' ? null : Number(event.target.value),
                  ),
                )
              }
              placeholder="0"
              aria-label="Focus duration in minutes"
              className={styles.orbInput}
            />
            <span className={styles.orbUnit} aria-hidden="true">
              min
            </span>
          </>
        ) : (
          <StarIcon size={27} />
        )}
      </span>

      <div className={styles.activeBody}>
        <div className={styles.activeTop}>
          <h2 className={cn(styles.eyebrow, styles.eyebrowUpper)}>ACTIVE TASK</h2>
        </div>

        {active && task ? (
          <button
            ref={titleRef}
            type="button"
            onClick={openPicker}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={styles.activeTitle}
          >
            {task.title}
          </button>
        ) : (
          <p className={styles.activeHint}>Decide what you are working on</p>
        )}
      </div>

      {active && task ? (
        <div className={styles.activeActions}>
          <button
            type="button"
            onClick={() => write(null)}
            aria-label="Cancel active task"
            className={styles.activeSmall}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              onCompleteTask?.(task);
              write(null);
            }}
            aria-label="Complete task"
            className={styles.activeSmall}
          >
            <Check size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => write(toggleRunning(active, Date.now()))}
            aria-label={running ? 'Pause focus timer' : 'Start focus timer'}
            className={cn(styles.activeBig, !running && styles.activeStart)}
          >
            {running ? (
              <Pause size={22} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Play size={22} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
      ) : candidates.length > 0 ? (
        <button
          ref={titleRef}
          type="button"
          onClick={openPicker}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Choose task"
          className={styles.activeAdd}
        >
          <Plus size={22} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}

      {open ? (
        <div
          ref={pickerRef}
          className={styles.activePicker}
          style={{ left: pickerPos.left, top: pickerPos.top, width: pickerPos.width }}
        >
          <ul
            ref={listRef}
            className="flex flex-col gap-1"
            role="listbox"
            aria-label="Open tasks for today"
          >
            {candidates.map((item) => (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === active?.taskId}
                  onClick={() => choose(item.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-item px-3 py-2 text-left text-[length:var(--fs-ui)] text-ws-text hover:bg-ws-accent-soft focus-visible:bg-ws-accent-soft focus-visible:outline-none motion-reduce:transition-none',
                    item.id === active?.taskId && 'bg-ws-accent-soft',
                  )}
                >
                  <span className={cn('size-2 shrink-0 rounded-full', DOT[item.priority])} />
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="shrink-0 text-[length:var(--fs-micro)] tabular-nums text-ws-text-muted">
                    {formatDisplayDateTime(item.deadlineAt, now, timeZone)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
