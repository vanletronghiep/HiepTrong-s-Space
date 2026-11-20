export type PhaseKind = 'focus' | 'short' | 'long';

export interface PlanPhase {
  kind: PhaseKind;
  minutes: number;
}

export interface PlanConfig {
  totalMinutes: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
}

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  totalMinutes: 120,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

export const PLAN_LIMITS = {
  totalMinutes: [15, 480],
  focusMinutes: [10, 90],
  shortBreakMinutes: [1, 15],
  longBreakMinutes: [5, 40],
  longBreakEvery: [2, 6],
} as const satisfies Record<keyof PlanConfig, readonly [number, number]>;

/**
 * Derive every break setting from the two numbers the user types: a short break is about a
 * fifth of the focus block, a long break is three short ones (at least 15 minutes), and long
 * blocks earn their long break sooner.
 */
export function planConfigFor(totalMinutes: number, focusMinutes: number): PlanConfig {
  const total = clampPlanValue('totalMinutes', Math.round(totalMinutes));
  const focus = clampPlanValue('focusMinutes', Math.round(focusMinutes));
  const shortBreak = Math.max(3, Math.min(10, Math.round(focus / 5)));
  return {
    totalMinutes: total,
    focusMinutes: focus,
    shortBreakMinutes: shortBreak,
    longBreakMinutes: Math.max(15, shortBreak * 3),
    longBreakEvery: focus >= 45 ? 3 : 4,
  };
}

/** A break that would leave only this much (or less) study time is folded into the last block. */
const TAIL_FOLD_MINUTES = 5;

/** Split a total study time into focus blocks separated by short/long breaks. */
export function buildStudyPlan(config: PlanConfig): PlanPhase[] {
  const plan: PlanPhase[] = [];
  let remaining = Math.max(1, Math.round(config.totalMinutes));
  let blocks = 0;
  while (remaining > 0) {
    const focus = Math.min(config.focusMinutes, remaining);
    plan.push({ kind: 'focus', minutes: focus });
    remaining -= focus;
    blocks += 1;
    if (remaining <= 0) break;
    const isLong = blocks % config.longBreakEvery === 0;
    const breakMinutes = isLong ? config.longBreakMinutes : config.shortBreakMinutes;
    if (remaining <= breakMinutes + TAIL_FOLD_MINUTES) {
      const last = plan[plan.length - 1];
      if (last) last.minutes += remaining;
      remaining = 0;
      break;
    }
    plan.push({ kind: isLong ? 'long' : 'short', minutes: breakMinutes });
    remaining -= breakMinutes;
  }
  return plan;
}

export interface PlanSummary {
  totalMinutes: number;
  focusMinutes: number;
  focusBlocks: number;
  breaks: number;
}

export function summarizePlan(plan: PlanPhase[]): PlanSummary {
  let focusMinutes = 0;
  let focusBlocks = 0;
  let breaks = 0;
  let totalMinutes = 0;
  for (const phase of plan) {
    totalMinutes += phase.minutes;
    if (phase.kind === 'focus') {
      focusMinutes += phase.minutes;
      focusBlocks += 1;
    } else {
      breaks += 1;
    }
  }
  return { totalMinutes, focusMinutes, focusBlocks, breaks };
}

export function clampPlanValue(key: keyof PlanConfig, value: number): number {
  const [min, max] = PLAN_LIMITS[key];
  return Math.min(max, Math.max(min, value));
}

export function formatDuration(minutes: number): string {
  const whole = Math.round(minutes);
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  if (h === 0) return `${m} m`;
  return `${h} h ${String(m).padStart(2, '0')} m`;
}
