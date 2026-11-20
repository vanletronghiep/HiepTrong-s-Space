import type { PlanPhase } from '@/domain/study-plan';
import { cn } from '@/ui/cn';
import styles from './focus-room.module.css';

const KIND_LABEL: Record<PlanPhase['kind'], string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
};

const KIND_CLASS: Record<PlanPhase['kind'], string> = {
  focus: styles.segFocus ?? '',
  short: styles.segShort ?? '',
  long: styles.segLong ?? '',
};

export function compactMinutes(minutes: number): string {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, '0')}m`;
}

/** Minutes of the plan that have passed, counting the part of the current phase that ran. */
export function elapsedPlanMinutes(
  plan: PlanPhase[],
  phaseIdx: number,
  secondsRemaining: number,
  ended: boolean,
): number {
  const total = plan.reduce((sum, phase) => sum + phase.minutes, 0);
  if (ended) return total;
  let done = 0;
  for (let index = 0; index < phaseIdx; index += 1) done += plan[index]?.minutes ?? 0;
  const current = plan[phaseIdx]?.minutes ?? 0;
  return done + Math.max(0, Math.min(current, current - secondsRemaining / 60));
}

interface PlanLineProps {
  plan: PlanPhase[];
  /** When set, the line fills as the session goes. */
  elapsedMinutes?: number;
}

/** One thin coloured line: focus, short break and long break in their own colours. */
export function PlanLine({ plan, elapsedMinutes }: PlanLineProps) {
  const tracking = elapsedMinutes !== undefined;
  const elapsed = elapsedMinutes ?? 0;
  let offset = 0;

  return (
    <div className={styles.planLineWrap}>
      <ul className={styles.planLine} aria-label="Session plan">
        {plan.map((phase, index) => {
          const start = offset;
          offset += phase.minutes;
          const fill = tracking ? Math.min(1, Math.max(0, (elapsed - start) / phase.minutes)) : 1;
          const label = `${KIND_LABEL[phase.kind]}, ${phase.minutes} minutes`;
          return (
            <li
              key={`${index}-${phase.kind}`}
              className={styles.planSeg}
              style={{ flexGrow: phase.minutes }}
              aria-label={label}
              title={label}
            >
              <span className={styles.planSegLabel} aria-hidden="true">
                {phase.kind === 'focus' ? compactMinutes(phase.minutes) : ''}
              </span>
              <span
                className={cn(styles.planBar, KIND_CLASS[phase.kind], tracking && styles.planTrack)}
              >
                {tracking ? (
                  <span className={styles.planFill} style={{ transform: `scaleX(${fill})` }} />
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
