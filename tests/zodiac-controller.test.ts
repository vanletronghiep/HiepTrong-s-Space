import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createInitialPlayheadState,
  createZodiacPlayheadController,
  GLOW_FADE_OUT_S,
  GLOW_MAX_OPACITY,
  GLOW_PERIOD_S,
  MAX_DT_S,
  MAX_FRAME_ELAPSED_S,
  stepPlayhead,
} from '@/features/zodiac/controller';
import { OUTLINE_PHASE_END } from '@/features/zodiac/schedule';

function integrateUntilSettled(
  initialP: number,
  target: number,
  hz: number,
  options: { glowEnabled?: boolean; initialGlowOpacity?: number } = {},
) {
  const dt = 1 / hz;
  const state = createInitialPlayheadState(initialP);
  state.target = target;
  if (typeof options.initialGlowOpacity === 'number') {
    state.glowOpacity = options.initialGlowOpacity;
  }

  let elapsed = 0;
  let steps = 0;
  const maxSteps = Math.ceil(10 * hz);
  const pHistory: number[] = [state.p];

  while (steps < maxSteps) {
    stepPlayhead(state, dt, { glowEnabled: options.glowEnabled ?? false });
    elapsed += dt;
    steps += 1;
    pHistory.push(state.p);
    if (state.v === 0 && state.p === state.target) {
      break;
    }
  }

  return { state, elapsed, steps, pHistory };
}

describe('Zodiac playhead controller timing & interruption', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('completes inward entry (~5.0s, within 4.75-5.25s) and faster outward exit (~1.3s) consistently across 20, 30, 60, and 120 Hz', () => {
    const inwardTimes: number[] = [];
    const outwardTimes: number[] = [];

    for (const hz of [20, 30, 60, 120]) {
      const inward = integrateUntilSettled(0, 1, hz);
      expect(inward.state.p).toBe(1);
      expect(inward.state.v).toBe(0);
      expect(inward.elapsed).toBeGreaterThanOrEqual(4.75);
      expect(inward.elapsed).toBeLessThanOrEqual(5.25);
      inwardTimes.push(inward.elapsed);

      const outward = integrateUntilSettled(1, 0, hz);
      expect(outward.state.p).toBe(0);
      expect(outward.state.v).toBe(0);
      expect(outward.elapsed).toBeGreaterThan(0.8);
      expect(outward.elapsed).toBeLessThan(inward.elapsed);
      expect(outward.elapsed).toBeCloseTo(1.3, 0);
      outwardTimes.push(outward.elapsed);
    }

    // Cross-frequency consistency (20Hz vs 120Hz within 150ms via bounded substepping)
    expect(Math.max(...inwardTimes) - Math.min(...inwardTimes)).toBeLessThan(0.15);
    expect(Math.max(...outwardTimes) - Math.min(...outwardTimes)).toBeLessThan(0.15);
  });

  it('sub-steps slow visible frames (50ms) cleanly, clamps extreme stalls to MAX_FRAME_ELAPSED_S, and ignores negative dt', () => {
    const slowFrameState = createInitialPlayheadState(0);
    slowFrameState.target = 1;
    stepPlayhead(slowFrameState, 0.05, { glowEnabled: false });

    const twoSubstepsState = createInitialPlayheadState(0);
    twoSubstepsState.target = 1;
    stepPlayhead(twoSubstepsState, MAX_DT_S, { glowEnabled: false });
    stepPlayhead(twoSubstepsState, 0.05 - MAX_DT_S, { glowEnabled: false });

    expect(slowFrameState.p).toBeCloseTo(twoSubstepsState.p, 12);
    expect(slowFrameState.v).toBeCloseTo(twoSubstepsState.v, 12);

    const stalledState = createInitialPlayheadState(0);
    stalledState.target = 1;
    stepPlayhead(stalledState, 5.0, { glowEnabled: false });

    const cappedState = createInitialPlayheadState(0);
    cappedState.target = 1;
    stepPlayhead(cappedState, MAX_FRAME_ELAPSED_S, { glowEnabled: false });

    expect(stalledState.p).toBeCloseTo(cappedState.p, 12);
    expect(stalledState.p).toBeLessThan(0.06);

    const beforeNegative = { ...slowFrameState };
    stepPlayhead(slowFrameState, -0.5, { glowEnabled: false });
    expect(slowFrameState.p).toBe(beforeNegative.p);
    expect(slowFrameState.v).toBe(beforeNegative.v);
  });

  it('supports smooth reversals at 10%, 50%, 8/13 (outline completion), 90%, and during completed glow', () => {
    for (const checkpoint of [0.1, 0.5, OUTLINE_PHASE_END, 0.9]) {
      const state = createInitialPlayheadState(0);
      state.target = 1;
      const dt = 1 / 60;
      let guard = 0;
      while (state.p < checkpoint && guard < 300) {
        stepPlayhead(state, dt, { glowEnabled: true });
        guard += 1;
      }
      expect(state.p).toBeGreaterThanOrEqual(checkpoint);
      expect(state.v).toBeGreaterThan(0);

      const pAtReverse = state.p;
      const vAtReverse = state.v;
      state.target = 0;

      // Immediate first step after reversal must preserve continuity (no reset to 0 or 1)
      stepPlayhead(state, dt, { glowEnabled: true });
      expect(Math.abs(state.p - pAtReverse)).toBeLessThan(0.02);
      expect(state.v).toBeLessThan(vAtReverse);

      // Continues smoothly until settled at 0
      let exitSteps = 0;
      while ((state.p > 0 || state.v !== 0) && exitSteps < 300) {
        stepPlayhead(state, dt, { glowEnabled: true });
        exitSteps += 1;
      }
      expect(state.p).toBe(0);
      expect(state.v).toBe(0);
    }

    // Reversal during completed glow (~80ms glow fade-out while playhead reverses cleanly)
    const glowState = createInitialPlayheadState(1);
    glowState.target = 1;
    for (let i = 0; i < 60; i += 1) {
      stepPlayhead(glowState, 1 / 60, { glowEnabled: true });
    }
    expect(glowState.glowOpacity).toBeCloseTo(GLOW_MAX_OPACITY, 4);
    expect(glowState.glowPhase).toBeGreaterThan(0);

    glowState.target = 0;
    const phaseAtHoverOut = glowState.glowPhase;
    const dt = 1 / 60;
    let fadeElapsed = 0;
    while (glowState.glowOpacity > 0 && fadeElapsed < 1) {
      stepPlayhead(glowState, dt, { glowEnabled: true });
      // glowPhase freezes immediately while fading opacity on hover out
      expect(glowState.glowPhase).toBe(phaseAtHoverOut);
      fadeElapsed += dt;
    }
    expect(glowState.glowOpacity).toBe(0);
    expect(fadeElapsed).toBeLessThanOrEqual(GLOW_FADE_OUT_S + dt + 1e-6);
    expect(glowState.p).toBeGreaterThan(0.8);
    expect(glowState.p).toBeLessThan(1);

    // Mid-reversal re-entry preserves frozen glowPhase instead of resetting prematurely
    for (let i = 0; i < 15; i += 1) {
      stepPlayhead(glowState, dt, { glowEnabled: true });
    }
    expect(glowState.p).toBeGreaterThan(0);
    expect(glowState.glowPhase).toBe(phaseAtHoverOut);
    glowState.target = 1;
    stepPlayhead(glowState, dt, { glowEnabled: true });
    expect(glowState.glowPhase).toBe(phaseAtHoverOut);

    // Only settling all the way back to idle (p = 0) resets glowPhase to 0
    glowState.target = 0;
    for (let i = 0; i < 200; i += 1) {
      stepPlayhead(glowState, dt, { glowEnabled: true });
      if (glowState.p === 0 && glowState.v === 0) break;
    }
    expect(glowState.p).toBe(0);
    expect(glowState.glowPhase).toBe(0);
  });

  it('cycles completed glow smoothly over the nominal 8.0-second period with bounded opacity <= 0.32', () => {
    expect(GLOW_PERIOD_S).toBe(8);
    const state = createInitialPlayheadState(1);
    state.target = 1;
    const dt = 1 / 60;
    const halfPeriodSteps = Math.round((GLOW_PERIOD_S / 2) * 60);

    for (let i = 0; i < halfPeriodSteps; i += 1) {
      const keepGoing = stepPlayhead(state, dt, { glowEnabled: true });
      expect(keepGoing).toBe(true);
      expect(state.glowOpacity).toBeLessThanOrEqual(GLOW_MAX_OPACITY + 1e-9);
      expect(state.glowOpacity).toBeGreaterThan(0);
    }

    expect(state.glowPhase).toBeCloseTo(0.5, 3);
  });

  it('preserves playhead and velocity across 20+ rapid intent toggles at 50-100ms intervals', () => {
    const rafQueue = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId;
      nextId += 1;
      rafQueue.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.delete(id);
    });

    const snapshots: Array<{ p: number; v: number; target: number }> = [];
    const controller = createZodiacPlayheadController({
      initialP: 0,
      glowEnabled: true,
      onRender: (snap) => {
        snapshots.push({ p: snap.p, v: snap.v, target: snap.target });
      },
    });

    let timeMs = 0;
    let currentTarget = 1;
    controller.setTarget(currentTarget);
    expect(rafQueue.size).toBe(1);

    for (let toggle = 0; toggle < 24; toggle += 1) {
      const intervalMs = toggle % 2 === 0 ? 50 : 90;
      const frames = Math.round(intervalMs / 16.67);
      for (let f = 0; f < frames; f += 1) {
        const entries = Array.from(rafQueue.entries());
        rafQueue.clear();
        for (const [, cb] of entries) {
          cb(timeMs);
        }
        timeMs += 16.67;
      }

      const beforeToggle = controller.getSnapshot();
      currentTarget = currentTarget === 1 ? 0 : 1;
      controller.setTarget(currentTarget);
      const afterToggle = controller.getSnapshot();

      // Target changes immediately, while p & v are never reset
      expect(afterToggle.target).toBe(currentTarget);
      expect(afterToggle.p).toBe(beforeToggle.p);
      expect(afterToggle.v).toBe(beforeToggle.v);
      expect(rafQueue.size).toBeLessThanOrEqual(1);
    }

    // Verify no catastrophic jump occurred between consecutive rendered frames
    for (let i = 1; i < snapshots.length; i += 1) {
      const prev = snapshots[i - 1]!;
      const curr = snapshots[i]!;
      expect(Math.abs(curr.p - prev.p)).toBeLessThan(0.05);
    }

    controller.destroy();
    expect(rafQueue.size).toBe(0);
    expect(controller.isRunning()).toBe(false);
  });

  it('pauses cleanly without dt spike on resume, and leaves zero rAFs at idle or destroy', () => {
    const rafQueue = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId;
      nextId += 1;
      rafQueue.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.delete(id);
    });

    const controller = createZodiacPlayheadController({
      initialP: 0,
      glowEnabled: false,
      onRender: () => {},
    });

    // Idle starts no loop
    expect(controller.isRunning()).toBe(false);
    expect(rafQueue.size).toBe(0);

    controller.setTarget(1);
    expect(controller.isRunning()).toBe(true);
    expect(rafQueue.size).toBe(1);

    // Advance a few frames
    for (let t = 0; t <= 100; t += 16.67) {
      const cb = Array.from(rafQueue.values())[0];
      rafQueue.clear();
      cb?.(t);
    }
    const pBeforePause = controller.getSnapshot().p;
    expect(pBeforePause).toBeGreaterThan(0);

    // Pause cancels rAF
    controller.setPaused(true);
    expect(controller.isRunning()).toBe(false);
    expect(rafQueue.size).toBe(0);

    // Resume much later (10 seconds later) -> first resumed frame resets timestamp (dt=0)
    controller.setPaused(false);
    expect(controller.isRunning()).toBe(true);
    expect(rafQueue.size).toBe(1);
    const firstResumeCb = Array.from(rafQueue.values())[0]!;
    rafQueue.clear();
    firstResumeCb(10_000);
    expect(controller.getSnapshot().p).toBe(pBeforePause);

    // Next frame advances by normal dt
    const secondResumeCb = Array.from(rafQueue.values())[0]!;
    rafQueue.clear();
    secondResumeCb(10_016.67);
    expect(controller.getSnapshot().p).toBeGreaterThan(pBeforePause);

    // Manual scrubber freezes at requested p without running loop unless glow requested
    controller.setManualProgress(0.45);
    expect(controller.getSnapshot().p).toBe(0.45);
    expect(controller.getSnapshot().v).toBe(0);
    expect(rafQueue.size).toBe(0);

    // Destroy cleans up any active loop
    controller.setTarget(1);
    expect(rafQueue.size).toBe(1);
    controller.destroy();
    expect(rafQueue.size).toBe(0);
    expect(controller.isRunning()).toBe(false);
  });
});
