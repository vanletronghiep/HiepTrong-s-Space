import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COLLECTION_SUBTITLE_COPY,
  computeCollectionRevealState,
  earthPose,
  EARTH_SPEED,
  formatRevealClipPath,
  getHomeViewportMode,
  getRevealMaxRadius,
  getRevealRadius,
  heroEarthPose,
  HOME_INTRO_COPY,
  REVEAL_SMOOTH_FACTOR,
  revealRadiusEase,
  stepSmoothProgress,
  supportsCollectionReveal,
} from '@/features/home/home-journey';

describe('Homepage Earth journey', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it.each([
    [1440, 900, 0.58, 2, 522],
    [390, 844, 0.6, 2.2, 327.6],
  ])(
    'frames the opening crop and full globe at %i × %i',
    (width, height, crest, scale, fullSize) => {
      const opening = earthPose(width, height, 0);
      const middle = earthPose(width, height, 0.29);
      const full = earthPose(width, height, 0.58);
      expect(opening.centerY - opening.diameter / 2).toBeCloseTo(height * crest);
      expect(opening.diameter).toBeCloseTo(width * scale);
      expect(middle.diameter).toBeLessThan(opening.diameter);
      expect(middle.diameter).toBeGreaterThan(full.diameter);
      expect(full.diameter).toBeCloseTo(fullSize);
      expect(full.centerY + full.diameter / 2).toBeLessThan(height);
      expect(earthPose(width, height, 1)).toEqual(full);
      expect(earthPose(width, height, -1)).toEqual(opening);
    },
  );

  it('completes one revolution per minute of active frame time', () => {
    expect(EARTH_SPEED * 60_000).toBeCloseTo(2 * Math.PI);
  });

  it('classifies desktop, stacked, and landscape-compact viewport modes cleanly', () => {
    expect(getHomeViewportMode(1440, 900)).toBe('desktop');
    expect(getHomeViewportMode(1280, 720)).toBe('desktop');
    expect(getHomeViewportMode(1024, 768)).toBe('desktop');
    expect(getHomeViewportMode(768, 900)).toBe('stacked');
    expect(getHomeViewportMode(375, 812)).toBe('stacked');
    expect(getHomeViewportMode(320, 812)).toBe('stacked');
    expect(getHomeViewportMode(640, 360)).toBe('landscape-compact');
  });

  it('computes non-overlapping Earth and personal introduction framing across target viewports', () => {
    // Stacked portrait viewports (< 1024px): Earth bottom stays >= 24px above intro top
    for (const [width, height, introH] of [
      [768, 900, 260],
      [375, 812, 270],
      [320, 812, 296],
    ] as const) {
      const pose = heroEarthPose(width, height, 0.78, introH);
      expect(pose.mode).toBe('stacked');
      const earthTop = pose.centerY - pose.diameter / 2;
      const earthBottom = pose.centerY + pose.diameter / 2;
      const introTop = height - (width < 768 ? 28 : 44) - introH;
      expect(earthTop).toBeGreaterThanOrEqual(width < 768 ? 76 : 102);
      expect(introTop - earthBottom).toBeGreaterThanOrEqual(24);
    }

    // Desktop viewports (>= 1024px): Earth clears both left viewport margin and right intro zone
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
      [1024, 900],
      [1024, 768],
    ] as const) {
      const pose = heroEarthPose(width, height, 0.78, 260);
      expect(pose.mode).toBe('desktop');
      const earthLeft = pose.centerX - pose.diameter / 2;
      const earthRight = pose.centerX + pose.diameter / 2;
      expect(earthLeft).toBeGreaterThanOrEqual(44);
      expect(width * 0.49 - earthRight).toBeGreaterThanOrEqual(48);
    }

    // 1280 @ 200% zoom (640x360): compact landscape side-by-side keeps Earth below header and left of 41vw intro
    const zoomed = heroEarthPose(640, 360, 0.78, 210);
    expect(zoomed.mode).toBe('landscape-compact');
    expect(zoomed.centerY - zoomed.diameter / 2).toBeGreaterThanOrEqual(58);
    expect(640 * 0.41 - (zoomed.centerX + zoomed.diameter / 2)).toBeGreaterThanOrEqual(24);
  });

  it('clamps reversible heroEarthPose progress and preserves verbatim introduction copy', () => {
    const start = heroEarthPose(1440, 900, 0);
    const rest = heroEarthPose(1440, 900, 0.78);
    expect(heroEarthPose(1440, 900, -0.5)).toEqual(start);
    expect(heroEarthPose(1440, 900, 1.5)).toEqual(rest);
    expect(start.diameter).toBeGreaterThan(rest.diameter);
    expect(HOME_INTRO_COPY.eyebrow).toBe('01 / About me');
    expect(HOME_INTRO_COPY.heading).toBe("Hi! I'm Hiep.");
    expect(HOME_INTRO_COPY.lead).toBe('First-year Advanced Program in Computer Science at HCMUS.');
    expect(HOME_INTRO_COPY.closing).toBe('My beginnings do not define my limits.');
  });

  it('defines the Midnight Galaxy collection subtitle placeholder verbatim', () => {
    expect(COLLECTION_SUBTITLE_COPY).toBe(
      'A collection of the spaces, ideas, and projects that shape my journey.',
    );
  });

  it('computes revealRadiusEase endpoints, clamping, exact 0.85p + 0.15p^2 curve, and strict monotonicity', () => {
    expect(revealRadiusEase(-0.5)).toBe(0);
    expect(revealRadiusEase(0)).toBe(0);
    expect(revealRadiusEase(Number.NaN)).toBe(0);
    expect(revealRadiusEase(0.2)).toBeCloseTo(0.85 * 0.2 + 0.15 * 0.04, 10);
    expect(revealRadiusEase(0.5)).toBeCloseTo(0.4625, 10);
    expect(revealRadiusEase(0.8)).toBeCloseTo(0.85 * 0.8 + 0.15 * 0.64, 10);
    expect(revealRadiusEase(1)).toBe(1);
    expect(revealRadiusEase(1.8)).toBe(1);

    let prev = -1;
    for (let i = 0; i <= 20; i += 1) {
      const p = i / 20;
      const value = revealRadiusEase(p);
      expect(value).toBeGreaterThan(prev);
      prev = value;
    }
  });

  it('covers all four viewport corners from bottom-left (0, height) independent of collection height', () => {
    for (const [width, height] of [
      [1440, 900],
      [1024, 768],
      [768, 900],
      [375, 812],
      [320, 812],
      [640, 360],
    ] as const) {
      const maxRadius = getRevealMaxRadius(width, height);
      expect(maxRadius).toBeCloseTo(Math.hypot(width, height) + 2, 10);
      expect(getRevealRadius(0, width, height)).toBe(0);
      expect(getRevealRadius(-0.2, width, height)).toBe(0);

      const fullRadius = getRevealRadius(1, width, height);
      expect(fullRadius).toBeCloseTo(maxRadius, 10);

      // Distance from bottom-left anchor (0, height) to all four viewport corners
      const cornerDistances = [
        Math.hypot(0 - 0, 0 - height),
        Math.hypot(width - 0, 0 - height),
        Math.hypot(0 - 0, height - height),
        Math.hypot(width - 0, height - height),
      ];
      for (const dist of cornerDistances) {
        expect(fullRadius).toBeGreaterThan(dist);
      }

      const midRadius = getRevealRadius(0.5, width, height);
      expect(midRadius).toBeCloseTo(0.4625 * maxRadius, 10);
      expect(formatRevealClipPath(midRadius, height)).toBe(
        `circle(${midRadius}px at 0px ${height}px)`,
      );
    }

    expect(formatRevealClipPath(-15, 0)).toBe('circle(0px at 0px 1px)');
  });

  it('computes reversible collection reveal state, stationary offsetY, and disabled fallback cleanly', () => {
    const revealStart = 2700;
    const vh = 900;
    const revealEnd = revealStart + vh;

    // Before and at revealStart -> hidden
    expect(computeCollectionRevealState(0, revealStart, vh)).toEqual({
      progress: 0,
      state: 'hidden',
      complete: false,
      offsetY: -vh,
    });
    expect(computeCollectionRevealState(revealStart, revealStart, vh)).toEqual({
      progress: 0,
      state: 'hidden',
      complete: false,
      offsetY: -vh,
    });

    // Partial coverage -> revealing with stationary compensation offsetY = scrollY - revealEnd
    const quarter = computeCollectionRevealState(revealStart + 225, revealStart, vh);
    expect(quarter.state).toBe('revealing');
    expect(quarter.complete).toBe(false);
    expect(quarter.progress).toBeCloseTo(0.25, 10);
    expect(quarter.offsetY).toBe(-675);

    const half = computeCollectionRevealState(revealStart + 450, revealStart, vh);
    expect(half.state).toBe('revealing');
    expect(half.complete).toBe(false);
    expect(half.progress).toBeCloseTo(0.5, 10);
    expect(half.offsetY).toBe(-450);

    // At and beyond revealEnd -> revealed
    expect(computeCollectionRevealState(revealEnd, revealStart, vh)).toEqual({
      progress: 1,
      state: 'revealed',
      complete: true,
      offsetY: 0,
    });
    expect(computeCollectionRevealState(revealEnd + 1500, revealStart, vh)).toEqual({
      progress: 1,
      state: 'revealed',
      complete: true,
      offsetY: 0,
    });

    // Reversible upward scroll produces identical deterministic snapshot
    expect(computeCollectionRevealState(revealStart + 450, revealStart, vh)).toEqual(half);

    // Disabled reveal (reduced motion or unsupported clip-path) -> ordinary document flow
    expect(computeCollectionRevealState(0, revealStart, vh, false)).toEqual({
      progress: 1,
      state: 'revealed',
      complete: true,
      offsetY: 0,
    });
  });

  it('checks reduced motion and CSS clip-path support in supportsCollectionReveal', () => {
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
    expect(supportsCollectionReveal(true)).toBe(false);
    expect(supportsCollectionReveal(false)).toBe(true);

    vi.stubGlobal('CSS', {
      supports: vi.fn((prop: string) => prop === '-webkit-clip-path'),
    });
    expect(supportsCollectionReveal(false)).toBe(true);

    vi.stubGlobal('CSS', { supports: vi.fn(() => false) });
    expect(supportsCollectionReveal(false)).toBe(false);
  });

  it('supports viewport-locked anchorOffsetY clamping in formatRevealClipPath', () => {
    expect(formatRevealClipPath(320, 900)).toBe('circle(320px at 0px 900px)');
    expect(formatRevealClipPath(320, 900, 180)).toBe('circle(320px at 0px 1080px)');
    expect(formatRevealClipPath(320, 900, -40)).toBe('circle(320px at 0px 900px)');
    expect(formatRevealClipPath(320, 900, Number.NaN)).toBe('circle(320px at 0px 900px)');
    expect(formatRevealClipPath(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY)).toBe(
      'circle(0px at 0px 1px)',
    );
  });

  it('smooths bidirectional reveal progress monotonically, frame-rate independently, and without overshoot', () => {
    expect(REVEAL_SMOOTH_FACTOR).toBe(0.28);

    // Ascending monotonic convergence without overshoot
    let asc = 0;
    for (let i = 0; i < 40; i += 1) {
      const next = stepSmoothProgress(asc, 0.75, 16.67);
      expect(next).toBeGreaterThanOrEqual(asc);
      expect(next).toBeLessThanOrEqual(0.75);
      asc = next;
    }
    expect(asc).toBe(0.75);

    // Descending monotonic convergence without undershoot
    let desc = 0.9;
    for (let i = 0; i < 40; i += 1) {
      const next = stepSmoothProgress(desc, 0.25, 16.67);
      expect(next).toBeLessThanOrEqual(desc);
      expect(next).toBeGreaterThanOrEqual(0.25);
      desc = next;
    }
    expect(desc).toBe(0.25);

    // Frame-rate independence across 8ms (120Hz), 16.67ms (60Hz), and 33ms (30Hz) over ~132ms
    let p8 = 0;
    for (let i = 0; i < 16; i += 1) p8 = stepSmoothProgress(p8, 0.8, 8);
    let p16 = 0;
    for (let i = 0; i < 8; i += 1) p16 = stepSmoothProgress(p16, 0.8, 16.67);
    let p33 = 0;
    for (let i = 0; i < 4; i += 1) p33 = stepSmoothProgress(p33, 0.8, 33);
    expect(Math.abs(p8 - p16)).toBeLessThan(0.01);
    expect(Math.abs(p33 - p16)).toBeLessThan(0.005);

    // < 0.0002 snap-to-target settle and non-snap outside threshold
    expect(stepSmoothProgress(0.4998, 0.5, 16.67)).toBe(0.5);
    expect(stepSmoothProgress(0.5002, 0.5, 16.67)).toBe(0.5);
    expect(stepSmoothProgress(0.5, 0.5, 16.67)).toBe(0.5);
    expect(stepSmoothProgress(0.49, 0.5, 16.67)).toBeLessThan(0.5);

    // Immediate smooth reversal on direction change without snapping to 0/1 or overshooting
    const fwd1 = stepSmoothProgress(0.2, 0.8, 16.67);
    const fwd2 = stepSmoothProgress(fwd1, 0.8, 16.67);
    expect(fwd2).toBeGreaterThan(fwd1);
    const rev1 = stepSmoothProgress(fwd2, 0.1, 16.67);
    expect(rev1).toBeLessThan(fwd2);
    expect(rev1).toBeGreaterThan(0.1);

    // Non-finite current/target clamping
    expect(stepSmoothProgress(Number.NaN, 0.4, 16.67)).toBe(0.4);
    expect(stepSmoothProgress(Number.NaN, -0.5, 16.67)).toBe(0);
    expect(stepSmoothProgress(Number.NaN, 1.5, 16.67)).toBe(1);
    expect(stepSmoothProgress(0.2, Number.NaN, 16.67)).toBeCloseTo(
      stepSmoothProgress(0.2, 0, 16.67),
      12,
    );
    expect(stepSmoothProgress(0.5, 1.5, 16.67)).toBeLessThanOrEqual(1);
  });
});
