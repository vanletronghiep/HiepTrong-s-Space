'use client';

import type { KeyboardEvent } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import type { PlanPhase } from '@/domain/study-plan';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { PlanLine, compactMinutes } from './PlanLine';
import { TimerRing } from './TimerRing';
import styles from './focus-room.module.css';

export interface DurationInputs {
  hours: string;
  minutes: string;
  focus: string;
}

export interface TodayTask {
  id: string;
  title: string;
}

interface NumberBoxProps {
  id: string;
  label: string;
  value: string;
  maxLength: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

function NumberBox({
  id,
  label,
  value,
  maxLength,
  max,
  step,
  unit,
  onChange,
  onCommit,
}: NumberBoxProps) {
  const nudge = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const current = Number(value) || 0;
    const next = current + (event.key === 'ArrowUp' ? step : -step);
    onChange(String(Math.min(max, Math.max(0, next))));
  };
  return (
    <span className={styles.numberBox}>
      <input
        id={id}
        className={styles.numberInput}
        aria-label={label}
        inputMode="numeric"
        autoComplete="off"
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        onKeyDown={nudge}
        onBlur={onCommit}
      />
      <span className={styles.numberUnit}>{unit}</span>
    </span>
  );
}

interface SetupPanelProps {
  inputs: DurationInputs;
  onInputs: (next: DurationInputs) => void;
  onCommit: () => void;
  plan: PlanPhase[];
  focusMinutes: number;
  totalMinutes: number;
  blocks: number;
  tasks: TodayTask[];
  taskId: string;
  onPickTask: (id: string) => void;
  sessionName: string;
  muted: boolean;
  onToggleMute: () => void;
  onBegin: () => void;
}

export function SetupPanel({
  inputs,
  onInputs,
  onCommit,
  plan,
  focusMinutes,
  totalMinutes,
  blocks,
  tasks,
  taskId,
  onPickTask,
  sessionName,
  muted,
  onToggleMute,
  onBegin,
}: SetupPanelProps) {
  const totalLabelId = 'focus-room-total-label';
  const focusId = 'focus-room-focus-minutes';
  const hoursId = 'focus-room-total-hours';
  const minutesId = 'focus-room-total-minutes';

  return (
    <div className={styles.setup}>
      <div className={styles.setupTop}>
        <TimerRing progress={0} tone="focus">
          <span className={styles.ringDigits}>{String(focusMinutes).padStart(2, '0')}:00</span>
        </TimerRing>
        <div className={styles.setupStart}>
          <span className={styles.sessionLabel}>{sessionName}</span>
          <div className={styles.startRow}>
            <Button
              variant="primary"
              pill
              leftIcon={<Play size={16} strokeWidth={2} aria-hidden="true" />}
              onClick={onBegin}
            >
              Begin focus
            </Button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={muted ? 'Turn sounds on' : 'Mute sounds'}
              aria-pressed={muted}
              onClick={onToggleMute}
            >
              {muted ? (
                <VolumeX size={18} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <Volume2 size={18} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <section className={styles.planBlock} aria-label="Suggested session">
        <div className={styles.planHead}>
          <h2 className={styles.fieldTitle}>Suggested session</h2>
          <span className={styles.planSummary}>
            {blocks} {blocks === 1 ? 'block' : 'blocks'} · {compactMinutes(totalMinutes)}
          </span>
        </div>
        <PlanLine plan={plan} />
        <ul className={styles.legend} aria-hidden="true">
          <li>
            <span className={cn(styles.legendDot, styles.segFocus)} />
            Focus
          </li>
          <li>
            <span className={cn(styles.legendDot, styles.segShort)} />
            Short break
          </li>
          <li>
            <span className={cn(styles.legendDot, styles.segLong)} />
            Long break
          </li>
        </ul>
      </section>

      <div className={styles.setupGrid}>
        <section className={styles.setupField} aria-label="Today's tasks">
          <h2 className={styles.fieldTitle}>Today&apos;s tasks</h2>
          <div className={styles.taskList}>
            {tasks.length === 0 ? (
              <p className={styles.quietCue}>Nothing scheduled for today.</p>
            ) : (
              tasks.map((task) => {
                const on = task.id === taskId;
                return (
                  <button
                    key={task.id}
                    type="button"
                    aria-pressed={on}
                    className={cn(styles.taskRow, on && styles.taskRowOn)}
                    onClick={() => onPickTask(on ? '' : task.id)}
                  >
                    <span className={styles.taskDot} aria-hidden="true" />
                    <span className={styles.taskTitle}>{task.title}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <div className={styles.setupField}>
          <div className={styles.inputGroup} role="group" aria-labelledby={totalLabelId}>
            <span id={totalLabelId} className={styles.fieldTitle}>
              Total study time
            </span>
            <div className={styles.inputRow}>
              <NumberBox
                id={hoursId}
                label="Hours"
                value={inputs.hours}
                maxLength={1}
                max={8}
                step={1}
                unit="h"
                onChange={(hours) => onInputs({ ...inputs, hours })}
                onCommit={onCommit}
              />
              <NumberBox
                id={minutesId}
                label="Minutes"
                value={inputs.minutes}
                maxLength={2}
                max={59}
                step={5}
                unit="m"
                onChange={(minutes) => onInputs({ ...inputs, minutes })}
                onCommit={onCommit}
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor={focusId} className={styles.fieldTitle}>
              Focus block
            </label>
            <div className={styles.inputRow}>
              <NumberBox
                id={focusId}
                label="Focus block minutes"
                value={inputs.focus}
                maxLength={2}
                max={90}
                step={5}
                unit="min"
                onChange={(focus) => onInputs({ ...inputs, focus })}
                onCommit={onCommit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
