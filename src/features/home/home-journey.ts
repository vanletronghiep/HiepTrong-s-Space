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

export const EARTH_SPEED = (2 * Math.PI) / 60_000;
export const INITIAL_EARTH_YAW = -1.82;
