// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  StarfieldEngine,
  computeTargetStarCount,
} from '@/features/home/starfield/starfield-engine';

function createMockCanvasContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    lineCap: 'round',
    strokeStyle: '',
    fillStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe('Homepage StarfieldEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scales target star count across mobile, tablet, and desktop viewports', () => {
    const mobile = computeTargetStarCount(390, 844, 8);
    const tablet = computeTargetStarCount(820, 1180, 8);
    const desktop = computeTargetStarCount(1440, 900, 8);
    const lowCpuDesktop = computeTargetStarCount(1440, 900, 2);

    expect(mobile).toBeGreaterThanOrEqual(650);
    expect(mobile).toBeLessThanOrEqual(950);
    expect(tablet).toBeGreaterThan(mobile);
    expect(desktop).toBeGreaterThan(tablet);
    expect(desktop).toBeGreaterThanOrEqual(2200);
    expect(lowCpuDesktop).toBeLessThan(desktop);
  });

  it('renders a single static frame without starting RAF loop under reducedMotion and cleans up safely', () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 1280 });
    Object.defineProperty(canvas, 'clientHeight', { value: 800 });
    const mockCtx = createMockCanvasContext();
    vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const engine = new StarfieldEngine({
      canvas,
      reducedMotion: true,
    });

    engine.start();
    expect(rafSpy).not.toHaveBeenCalled();
    expect(mockCtx.clearRect).toHaveBeenCalled();

    const highCount = engine.getActiveStarCount();
    engine.setQuality('medium');
    expect(engine.getActiveStarCount()).toBeLessThan(highCount);

    engine.setSpeedMultiplier(12);
    expect(engine.getSpeedMultiplier()).toBe(8);
    engine.stepFrame(0.016);

    // Double destroy is safe (Strict Mode)
    engine.destroy();
    engine.destroy();
  });
});
