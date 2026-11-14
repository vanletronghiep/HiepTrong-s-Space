export const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));

export function ease(progress: number) {
  const p = clamp(progress);
  return p * p * (3 - 2 * p);
}

export const mix = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export function earthPose(width: number, height: number, progress: number) {
  const phone = width < 768;
  const zoom = ease(progress / 0.58);
  const opening = width * (phone ? 2.2 : 2);
  const full = Math.min(width * (phone ? 0.84 : 0.72), height * (phone ? 0.44 : 0.58));
  return {
    diameter: mix(opening, full, zoom),
    centerY: mix(height * (phone ? 0.6 : 0.58) + opening / 2, height * (phone ? 0.52 : 0.5), zoom),
  };
}

export type HomeViewportMode = 'desktop' | 'landscape-compact' | 'stacked';

export interface HeroEarthPose {
  mode: HomeViewportMode;
  diameter: number;
  fullDiameter: number;
  centerX: number;
  centerY: number;
}

export const HOME_INTRO_COPY = {
  eyebrow: '01 / About me',
  heading: "Hi! I'm Hiep.",
  lead: 'First-year Advanced Program in Computer Science at HCMUS.',
  body: 'Passionate about AI, Machine Learning, and their applications. I enjoy solving problems, exploring new technologies, and turning ideas into real projects.',
  closing: 'My beginnings do not define my limits.',
} as const;

export function getHomeViewportMode(width: number, height: number): HomeViewportMode {
  if (width >= 1024) {
    return 'desktop';
  }
  if (width >= 560 && height < 520) {
    return 'landscape-compact';
  }
  return 'stacked';
}

export function heroEarthPose(
  width: number,
  height: number,
  progress: number,
  introHeight = 0,
): HeroEarthPose {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const mode = getHomeViewportMode(safeW, safeH);

  let openingDiameter: number;
  let openingCenterY: number;
  let fullDiameter: number;
  let restCenterX: number;
  let restCenterY: number;

  if (mode === 'desktop') {
    openingDiameter = safeW * 2;
    openingCenterY = safeH * 0.58 + openingDiameter / 2;
    fullDiameter = Math.min(safeW * 0.34, safeH * 0.54, 500);
    restCenterX = Math.max(fullDiameter / 2 + Math.max(44, safeW * 0.045), safeW * 0.22);
    restCenterY = safeH * 0.52;
  } else if (mode === 'landscape-compact') {
    const headerReserve = 58;
    const usableH = Math.max(120, safeH - headerReserve - 20);
    openingDiameter = safeW * 1.8;
    openingCenterY = safeH * 0.6 + openingDiameter / 2;
    fullDiameter = Math.min(safeW * 0.32, usableH * 0.84, 240);
    restCenterX = safeW * 0.2;
    restCenterY = headerReserve + (safeH - headerReserve) * 0.5;
  } else {
    const phone = safeW < 768;
    const headerReserve = phone ? 76 : 102;
    const bottomMargin = phone ? 28 : 44;
    const minGap = phone ? 28 : 32;
    const effectiveIntroH = introHeight > 0 ? introHeight : phone ? 290 : 260;
    const introTopY = safeH - bottomMargin - effectiveIntroH;
    const availableSky = Math.max(120, introTopY - minGap - headerReserve);

    openingDiameter = safeW * (phone ? 2.2 : 2);
    openingCenterY = safeH * (phone ? 0.6 : 0.58) + openingDiameter / 2;
    fullDiameter = Math.min(safeW * (phone ? 0.72 : 0.52), availableSky * 0.86, 380);
    restCenterX = safeW / 2;
    restCenterY = headerReserve + (availableSky - fullDiameter) * 0.52 + fullDiameter / 2;
  }

  const zoom = ease(clamp(progress / 0.44));
  const shift = ease(clamp((progress - 0.44) / 0.34));

  return {
    mode,
    diameter: mix(openingDiameter, fullDiameter, zoom),
    fullDiameter,
    centerX: mix(safeW / 2, restCenterX, shift),
    centerY: mix(openingCenterY, restCenterY, zoom),
  };
}

export const EARTH_SPEED = (2 * Math.PI) / 60_000;
export const INITIAL_EARTH_YAW = -1.82;

export type CollectionRevealState = 'hidden' | 'revealing' | 'revealed';

export interface CollectionRevealSnapshot {
  progress: number;
  state: CollectionRevealState;
  complete: boolean;
  offsetY: number;
}

export const COLLECTION_SUBTITLE_COPY =
  'A collection of the spaces, ideas, and projects that shape my journey.';

export const REVEAL_SMOOTH_FACTOR = 0.28;

/** Advances reveal smoothing monotonically toward `target` without overshoot or auto-completion. */
export function stepSmoothProgress(
  current: number,
  target: number,
  dtMs: number,
  factor = REVEAL_SMOOTH_FACTOR,
): number {
  const safeTarget = Number.isNaN(target) ? 0 : clamp(target);
  if (!Number.isFinite(current)) {
    return safeTarget;
  }
  const safeFactor = Number.isFinite(factor) ? clamp(factor, 0, 1) : REVEAL_SMOOTH_FACTOR;
  const clampedDt = clamp(Number.isFinite(dtMs) ? dtMs : 16.67, 4, 50);
  const alpha = 1 - Math.pow(1 - safeFactor, clampedDt / 16.6667);
  const next = current + (safeTarget - current) * alpha;
  return Math.abs(safeTarget - next) < 0.0002 ? safeTarget : clamp(next);
}

export function revealRadiusEase(progress: number): number {
  const p = Number.isNaN(progress) ? 0 : clamp(progress);
  return 0.85 * p + 0.15 * p * p;
}

export function getRevealMaxRadius(width: number, height: number): number {
  const safeWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
  return Math.hypot(safeWidth, safeHeight) + 2;
}

export function getRevealRadius(progress: number, width: number, height: number): number {
  const p = Number.isNaN(progress) ? 0 : clamp(progress);
  if (p <= 0) {
    return 0;
  }
  return revealRadiusEase(p) * getRevealMaxRadius(width, height);
}

export function formatRevealClipPath(
  radius: number,
  viewportHeight: number,
  anchorOffsetY = 0,
): string {
  const safeRadius = Number.isFinite(radius) ? Math.max(0, radius) : 0;
  const safeHeight = Number.isFinite(viewportHeight) ? Math.max(1, viewportHeight) : 1;
  const safeOffset = Number.isFinite(anchorOffsetY) ? Math.max(0, anchorOffsetY) : 0;
  return `circle(${safeRadius}px at 0px ${safeHeight + safeOffset}px)`;
}

export function computeCollectionRevealState(
  scrollY: number,
  revealStart: number,
  viewportHeight: number,
  revealEnabled = true,
): CollectionRevealSnapshot {
  if (!revealEnabled) {
    return {
      progress: 1,
      state: 'revealed' as const,
      complete: true,
      offsetY: 0,
    };
  }

  const distance = Math.max(1, Number.isFinite(viewportHeight) ? viewportHeight : 1);
  const revealEnd = revealStart + distance;
  const rawProgress = (scrollY - revealStart) / distance;
  const progress = Number.isNaN(rawProgress) ? 0 : clamp(rawProgress, 0, 1);

  if (progress <= 0) {
    return {
      progress: 0,
      state: 'hidden' as const,
      complete: false,
      offsetY: -distance,
    };
  }

  if (progress >= 1) {
    return {
      progress: 1,
      state: 'revealed' as const,
      complete: true,
      offsetY: 0,
    };
  }

  return {
    progress,
    state: 'revealing' as const,
    complete: false,
    offsetY: scrollY - revealEnd,
  };
}

export function supportsCollectionReveal(reducedMotion: boolean): boolean {
  if (reducedMotion) {
    return false;
  }
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return (
      CSS.supports('clip-path', 'circle(10px at 0px 10px)') ||
      CSS.supports('-webkit-clip-path', 'circle(10px at 0px 10px)')
    );
  }
  return true;
}
