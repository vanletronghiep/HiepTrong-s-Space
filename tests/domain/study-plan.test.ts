import { describe, expect, it } from 'vitest';
import {
  buildStudyPlan,
  DEFAULT_PLAN_CONFIG,
  planConfigFor,
  summarizePlan,
} from '@/domain/study-plan';
import {
  advanceRun,
  finishRunEarly,
  parseStudyRun,
  pauseRun,
  resumeRun,
  runTotals,
  startRun,
} from '@/domain/study-session';

const MIN = 60_000;

describe('buildStudyPlan', () => {
  it('splits 120 minutes into 25-minute blocks with short and long breaks', () => {
    const plan = buildStudyPlan(DEFAULT_PLAN_CONFIG);
    expect(summarizePlan(plan).totalMinutes).toBe(120);
    expect(plan[0]).toEqual({ kind: 'focus', minutes: 25 });
    expect(plan[1]).toEqual({ kind: 'short', minutes: 5 });
    expect(plan.some((p) => p.kind === 'long')).toBe(false);
  });

  it('inserts a long break after the configured number of blocks', () => {
    const plan = buildStudyPlan({ ...DEFAULT_PLAN_CONFIG, totalMinutes: 240 });
    expect(plan.filter((p) => p.kind === 'long')).toHaveLength(1);
    expect(plan.findIndex((p) => p.kind === 'long')).toBe(7);
  });

  it('folds a tiny remainder into the last focus block', () => {
    const plan = buildStudyPlan({ ...DEFAULT_PLAN_CONFIG, totalMinutes: 35 });
    expect(plan).toEqual([{ kind: 'focus', minutes: 35 }]);
  });
});

describe('planConfigFor', () => {
  it('derives breaks from the two typed numbers', () => {
    expect(planConfigFor(120, 25)).toEqual({
      totalMinutes: 120,
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakEvery: 4,
    });
    expect(planConfigFor(180, 50)).toMatchObject({
      shortBreakMinutes: 10,
      longBreakMinutes: 30,
      longBreakEvery: 3,
    });
  });

  it('keeps both numbers inside the allowed limits', () => {
    expect(planConfigFor(5, 3)).toMatchObject({ totalMinutes: 15, focusMinutes: 10 });
    expect(planConfigFor(900, 200)).toMatchObject({ totalMinutes: 480, focusMinutes: 90 });
  });
});

describe('study session transitions', () => {
  const plan = buildStudyPlan({ ...DEFAULT_PLAN_CONFIG, totalMinutes: 40 });

  it('walks through phases after a long sleep and ends at the last deadline', () => {
    const start = 1_000_000;
    const { run, changed } = advanceRun(startRun(plan, start), start + 90 * MIN);
    expect(changed).toBe(true);
    expect(run.endedAt).toBe(start + 40 * MIN);
    expect(runTotals(run)).toMatchObject({
      focusMinutes: 35,
      breakMinutes: 5,
      durationMinutes: 40,
    });
  });

  it('shifts the deadline by the paused time', () => {
    const start = 0;
    let run = startRun(plan, start);
    run = pauseRun(run, 10 * MIN);
    run = resumeRun(run, 12 * MIN);
    expect(run.deadline).toBe(27 * MIN);
    expect(run.pausedMs).toBe(2 * MIN);
  });

  it('records when every focus block ran, including one cut short', () => {
    const start = 0;
    const walked = advanceRun(startRun(plan, start), start + 26 * MIN).run;
    expect(walked.focusSpans).toEqual([[0, 25 * MIN]]);
    const early = finishRunEarly(walked, 28 * MIN);
    expect(early.focusSpans).toEqual([[0, 25 * MIN]]);
    const second = advanceRun(startRun(plan, start), start + 31 * MIN).run;
    expect(finishRunEarly(second, 36 * MIN).focusSpans).toEqual([
      [0, 25 * MIN],
      [30 * MIN, 36 * MIN],
    ]);
  });

  it('loads a saved run from before focus spans existed', () => {
    const saved = startRun(plan, 0) as unknown as Record<string, unknown>;
    delete saved.focusSpans;
    expect(parseStudyRun(saved)?.focusSpans).toEqual([]);
    expect(parseStudyRun({ ...saved, focusSpans: 'nope' })).toBeNull();
    expect(parseStudyRun(null)).toBeNull();
  });

  it('credits only the part of the phase that ran when finishing early', () => {
    const start = 0;
    let run = startRun(plan, start);
    run = pauseRun(run, 10 * MIN);
    run = finishRunEarly(run, 14 * MIN);
    expect(runTotals(run)).toMatchObject({
      focusMinutes: 10,
      pausedMinutes: 4,
      durationMinutes: 14,
    });
  });
});
