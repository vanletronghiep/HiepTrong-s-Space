import type { PlanPhase } from './study-plan';

const MINUTE_MS = 60_000;

/** A running (or just-ended) study session. All times are epoch milliseconds. */
export interface StudyRun {
  plan: PlanPhase[];
  startedAt: number;
  /** Total time spent paused across the whole session. */
  pausedMs: number;
  /** Set while paused. */
  pausedAt: number | null;
  phaseIdx: number;
  phaseStart: number;
  /** Time paused inside the current phase. */
  phasePausedMs: number;
  deadline: number;
  focusMs: number;
  breakMs: number;
  /** Set once the last phase has finished or the session was ended early. */
  endedAt: number | null;
  /** Wall-clock `[start, end]` of every focus phase that has finished, for time-of-day stats. */
  focusSpans: [number, number][];
}

export interface AdvanceResult {
  run: StudyRun;
  /** True when at least one phase boundary was crossed. */
  changed: boolean;
}

function phaseMs(plan: PlanPhase[], idx: number): number {
  return (plan[idx]?.minutes ?? 0) * MINUTE_MS;
}

function credit(run: StudyRun, ms: number): StudyRun {
  if (ms <= 0) return run;
  return currentKind(run) === 'focus'
    ? { ...run, focusMs: run.focusMs + ms }
    : { ...run, breakMs: run.breakMs + ms };
}

function currentKind(run: StudyRun): 'focus' | 'break' {
  return run.plan[run.phaseIdx]?.kind === 'focus' ? 'focus' : 'break';
}

function closeSpan(run: StudyRun, end: number): StudyRun {
  if (currentKind(run) !== 'focus' || end <= run.phaseStart) return run;
  return { ...run, focusSpans: [...run.focusSpans, [run.phaseStart, end]] };
}

export function startRun(plan: PlanPhase[], now: number): StudyRun {
  return {
    plan,
    startedAt: now,
    pausedMs: 0,
    pausedAt: null,
    phaseIdx: 0,
    phaseStart: now,
    phasePausedMs: 0,
    deadline: now + phaseMs(plan, 0),
    focusMs: 0,
    breakMs: 0,
    endedAt: null,
    focusSpans: [],
  };
}

export function pauseRun(run: StudyRun, now: number): StudyRun {
  if (run.endedAt !== null || run.pausedAt !== null) return run;
  return { ...run, pausedAt: now };
}

export function resumeRun(run: StudyRun, now: number): StudyRun {
  if (run.pausedAt === null) return run;
  const pause = Math.max(0, now - run.pausedAt);
  return {
    ...run,
    pausedAt: null,
    pausedMs: run.pausedMs + pause,
    phasePausedMs: run.phasePausedMs + pause,
    deadline: run.deadline + pause,
  };
}

/** Move through every phase whose deadline has passed. Safe to call after a long sleep. */
export function advanceRun(run: StudyRun, now: number): AdvanceResult {
  if (run.endedAt !== null || run.pausedAt !== null) return { run, changed: false };
  let current = run;
  let changed = false;
  while (current.endedAt === null && now >= current.deadline) {
    changed = true;
    current = credit(current, current.deadline - current.phaseStart - current.phasePausedMs);
    current = closeSpan(current, current.deadline);
    if (current.phaseIdx >= current.plan.length - 1) {
      current = { ...current, endedAt: current.deadline };
      break;
    }
    const nextIdx = current.phaseIdx + 1;
    current = {
      ...current,
      phaseIdx: nextIdx,
      phaseStart: current.deadline,
      phasePausedMs: 0,
      deadline: current.deadline + phaseMs(current.plan, nextIdx),
    };
  }
  return { run: current, changed };
}

/** End the session now, crediting the part of the current phase that actually ran. */
export function finishRunEarly(run: StudyRun, now: number): StudyRun {
  if (run.endedAt !== null) return run;
  let current = run;
  if (current.pausedAt !== null) {
    const pause = Math.max(0, now - current.pausedAt);
    current = {
      ...current,
      pausedAt: null,
      pausedMs: current.pausedMs + pause,
      phasePausedMs: current.phasePausedMs + pause,
    };
  }
  current = credit(current, Math.max(0, now - current.phaseStart - current.phasePausedMs));
  current = closeSpan(current, now);
  return { ...current, endedAt: now };
}

export function remainingSeconds(run: StudyRun, now: number): number {
  const reference = run.pausedAt ?? now;
  return Math.max(0, Math.ceil((run.deadline - reference) / 1000));
}

export interface RunTotals {
  focusMinutes: number;
  breakMinutes: number;
  pausedMinutes: number;
  durationMinutes: number;
}

export function runTotals(run: StudyRun): RunTotals {
  const end = run.endedAt ?? run.startedAt;
  return {
    focusMinutes: run.focusMs / MINUTE_MS,
    breakMinutes: run.breakMs / MINUTE_MS,
    pausedMinutes: run.pausedMs / MINUTE_MS,
    durationMinutes: Math.max(0.001, (end - run.startedAt) / MINUTE_MS),
  };
}

function isSpanList(value: unknown): value is [number, number][] {
  return (
    Array.isArray(value) &&
    value.every(
      (span) =>
        Array.isArray(span) &&
        span.length === 2 &&
        typeof span[0] === 'number' &&
        typeof span[1] === 'number',
    )
  );
}

/** Validate a saved run. Runs saved before `focusSpans` existed load with no spans. */
export function parseStudyRun(value: unknown): StudyRun | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.focusSpans !== undefined && !isSpanList(v.focusSpans)) return null;
  if (!hasRunShape(v)) return null;
  return { ...(v as unknown as StudyRun), focusSpans: (v.focusSpans as [number, number][]) ?? [] };
}

function hasRunShape(v: Record<string, unknown>): boolean {
  return (
    Array.isArray(v.plan) &&
    v.plan.every(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as PlanPhase).minutes === 'number' &&
        ['focus', 'short', 'long'].includes((p as PlanPhase).kind),
    ) &&
    v.plan.length > 0 &&
    typeof v.startedAt === 'number' &&
    typeof v.pausedMs === 'number' &&
    (v.pausedAt === null || typeof v.pausedAt === 'number') &&
    typeof v.phaseIdx === 'number' &&
    typeof v.phaseStart === 'number' &&
    typeof v.phasePausedMs === 'number' &&
    typeof v.deadline === 'number' &&
    typeof v.focusMs === 'number' &&
    typeof v.breakMs === 'number' &&
    (v.endedAt === null || typeof v.endedAt === 'number')
  );
}
