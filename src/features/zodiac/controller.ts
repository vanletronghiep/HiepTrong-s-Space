import { OUTLINE_PHASE_END, clamp01 } from './schedule';
import type { PlayheadState, ZodiacControllerSnapshot, ZodiacPhase } from './types';

export const VELOCITY_RESPONSE_TIME_S = 0.045;
export const FORWARD_MAX_SPEED = 1 / 4.8;
export const REVERSE_MAX_SPEED = 1 / 1.05;
export const MAX_DT_S = 1 / 30;
export const MAX_FRAME_ELAPSED_S = 0.25;
export const SETTLE_DISTANCE = 0.0005;
export const SETTLE_VELOCITY = 0.01;
export const GLOW_PERIOD_S = 8.0;
export const GLOW_FADE_IN_S = 0.18;
export const GLOW_FADE_OUT_S = 0.08;
export const GLOW_MAX_OPACITY = 0.32;

export function getPhaseForPlayhead(p: number): ZodiacPhase {
  if (p <= 0) return 'idle';
  if (p >= 1) return 'complete';
  return p < OUTLINE_PHASE_END ? 'outline' : 'fill';
}

export function createInitialPlayheadState(initialP = 0): PlayheadState {
  const clamped = clamp01(initialP);
  return {
    p: clamped,
    v: 0,
    target: clamped,
    glowPhase: 0,
    glowOpacity: 0,
  };
}

/**
 * Pure deterministic integration step for the interruptible playhead controller.
 * Sub-steps visible frame deltas <= MAX_DT_S so slow/irregular frames consume full
 * elapsed visible time without instability. Mutates `state` in place and returns
 * `true` if further frames are needed, or `false` when settled and idle.
 */
export function stepPlayhead(
  state: PlayheadState,
  dtSeconds: number,
  options: { glowEnabled?: boolean; forwardMaxSpeed?: number } = {},
): boolean {
  const glowEnabled = options.glowEnabled ?? true;
  const forwardMaxSpeed = options.forwardMaxSpeed ?? FORWARD_MAX_SPEED;
  let remaining = Math.min(Math.max(dtSeconds, 0), MAX_FRAME_ELAPSED_S);

  const integrateSubstep = (dt: number) => {
    const rawDesired = (state.target - state.p) / VELOCITY_RESPONSE_TIME_S;
    const desiredVelocity = Math.max(-REVERSE_MAX_SPEED, Math.min(forwardMaxSpeed, rawDesired));

    const alpha = dt > 0 ? 1 - Math.exp(-dt / VELOCITY_RESPONSE_TIME_S) : 0;
    const nextV = state.v + (desiredVelocity - state.v) * alpha;
    const nextP = clamp01(state.p + nextV * dt);

    state.v = nextV;
    state.p = nextP;

    const playheadSettled =
      Math.abs(state.target - state.p) < SETTLE_DISTANCE && Math.abs(state.v) < SETTLE_VELOCITY;

    if (playheadSettled) {
      state.p = state.target;
      state.v = 0;
    }

    if (glowEnabled && playheadSettled && state.target >= 1) {
      state.glowPhase = (state.glowPhase + dt / GLOW_PERIOD_S) % 1;
      state.glowOpacity = Math.min(
        GLOW_MAX_OPACITY,
        state.glowOpacity + GLOW_MAX_OPACITY * (dt / GLOW_FADE_IN_S),
      );
      return;
    }

    if (!glowEnabled) {
      state.glowOpacity = 0;
    } else if (state.glowOpacity > 0) {
      // Freeze glowPhase immediately on hover out while fading remaining highlight over ~80ms.
      state.glowOpacity = Math.max(
        0,
        state.glowOpacity - GLOW_MAX_OPACITY * (dt / GLOW_FADE_OUT_S),
      );
    }

    if (playheadSettled && state.p <= 0 && state.target <= 0 && state.glowOpacity <= 0) {
      state.glowPhase = 0;
    }
  };

  if (remaining <= 0) {
    integrateSubstep(0);
  } else {
    while (remaining > 1e-7) {
      const stepDt = Math.min(remaining, MAX_DT_S);
      remaining -= stepDt;
      integrateSubstep(stepDt);
    }
  }

  const settled =
    Math.abs(state.target - state.p) < SETTLE_DISTANCE && Math.abs(state.v) < SETTLE_VELOCITY;
  if (glowEnabled && settled && state.target >= 1) {
    return true;
  }
  return !settled || state.glowOpacity > 0;
}

export function getControllerSnapshot(state: PlayheadState): ZodiacControllerSnapshot {
  const settled =
    Math.abs(state.target - state.p) < SETTLE_DISTANCE && Math.abs(state.v) < SETTLE_VELOCITY;
  return {
    p: state.p,
    v: state.v,
    target: state.target,
    phase: getPhaseForPlayhead(state.p),
    glowPhase: state.glowPhase,
    glowOpacity: state.glowOpacity,
    settled,
  };
}

export interface ZodiacPlayheadControllerOptions {
  initialP?: number;
  glowEnabled?: boolean;
  /** Forward playhead speed in playhead-units per second (defaults to 1 / 4.8s). */
  forwardMaxSpeed?: number;
  onRender: (snapshot: ZodiacControllerSnapshot) => void;
}

export interface ZodiacPlayheadController {
  getState(): PlayheadState;
  getSnapshot(): ZodiacControllerSnapshot;
  isRunning(): boolean;
  setTarget(target: number): void;
  setPaused(paused: boolean): void;
  setGlowEnabled(enabled: boolean): void;
  /** Overrides the forward speed; non-positive values restore the default. */
  setForwardSpeed(unitsPerSecond: number): void;
  setManualProgress(progress: number, options?: { runCompletedGlow?: boolean }): void;
  destroy(): void;
}

/**
 * Creates an interruptible single-rAF playhead driver that updates SVG refs
 * directly via `onRender` with zero React state updates per frame.
 */
export function createZodiacPlayheadController(
  options: ZodiacPlayheadControllerOptions,
): ZodiacPlayheadController {
  const state = createInitialPlayheadState(options.initialP ?? 0);
  let glowEnabled = options.glowEnabled ?? true;
  let forwardMaxSpeed = options.forwardMaxSpeed ?? FORWARD_MAX_SPEED;
  let paused = false;
  let manualMode = false;
  let destroyed = false;
  let rafId = 0;
  let lastTimestampMs: number | null = null;

  const cancelLoop = () => {
    if (rafId !== 0 && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
    }
    rafId = 0;
    lastTimestampMs = null;
  };

  const needsAnimation = (): boolean => {
    if (destroyed || paused) return false;
    if (manualMode) {
      return glowEnabled && state.p >= 1 && state.target >= 1;
    }
    const playheadSettled =
      Math.abs(state.target - state.p) < SETTLE_DISTANCE && Math.abs(state.v) < SETTLE_VELOCITY;
    if (!playheadSettled) return true;
    if (glowEnabled && state.target >= 1) return true;
    if (state.glowOpacity > 0) return true;
    return false;
  };

  const tick = (timestampMs: number) => {
    rafId = 0;
    if (destroyed || paused) {
      lastTimestampMs = null;
      return;
    }
    if (manualMode && !(glowEnabled && state.p >= 1 && state.target >= 1)) {
      lastTimestampMs = null;
      return;
    }

    const dtSeconds =
      lastTimestampMs === null ? 0 : Math.max(0, (timestampMs - lastTimestampMs) / 1000);
    lastTimestampMs = timestampMs;

    const keepRunning = stepPlayhead(state, dtSeconds, { glowEnabled, forwardMaxSpeed });
    options.onRender(getControllerSnapshot(state));

    if (keepRunning && !destroyed && !paused && needsAnimation()) {
      rafId = requestAnimationFrame(tick);
    } else {
      lastTimestampMs = null;
    }
  };

  const ensureRunning = () => {
    if (rafId !== 0 || !needsAnimation()) return;
    if (typeof requestAnimationFrame !== 'function') return;
    lastTimestampMs = null;
    rafId = requestAnimationFrame(tick);
  };

  return {
    getState() {
      return state;
    },
    getSnapshot() {
      return getControllerSnapshot(state);
    },
    isRunning() {
      return rafId !== 0;
    },
    setTarget(nextTarget: number) {
      manualMode = false;
      const clampedTarget = clamp01(nextTarget);
      if (state.target === clampedTarget && !needsAnimation()) {
        return;
      }
      state.target = clampedTarget;
      if (paused) return;
      ensureRunning();
    },
    setPaused(nextPaused: boolean) {
      if (paused === nextPaused) return;
      paused = nextPaused;
      if (paused) {
        cancelLoop();
      } else {
        ensureRunning();
      }
    },
    setGlowEnabled(enabled: boolean) {
      if (glowEnabled === enabled) return;
      glowEnabled = enabled;
      if (!glowEnabled) {
        state.glowOpacity = 0;
        options.onRender(getControllerSnapshot(state));
        if (!needsAnimation()) {
          cancelLoop();
        }
      } else {
        ensureRunning();
      }
    },
    setForwardSpeed(unitsPerSecond: number) {
      forwardMaxSpeed = unitsPerSecond > 0 ? unitsPerSecond : FORWARD_MAX_SPEED;
    },
    setManualProgress(progress: number, manualOptions?: { runCompletedGlow?: boolean }) {
      const clamped = clamp01(progress);
      const runGlow = Boolean(manualOptions?.runCompletedGlow) && clamped >= 1 && glowEnabled;
      manualMode = true;
      state.p = clamped;
      state.v = 0;
      state.target = clamped;
      if (!runGlow) {
        cancelLoop();
        state.glowOpacity = 0;
        options.onRender(getControllerSnapshot(state));
        return;
      }
      options.onRender(getControllerSnapshot(state));
      if (!paused) {
        ensureRunning();
      }
    },
    destroy() {
      destroyed = true;
      cancelLoop();
    },
  };
}
