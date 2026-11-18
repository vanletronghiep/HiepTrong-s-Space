/**
 * Pure load-time estimation for the route loader (v3.2).
 * History is a per-route exponential moving average of measured navigation-to-ready durations,
 * kept separately for the first ("cold") and repeat ("warm") visit of a session.
 */
export type LoadKind = 'cold' | 'warm';

export interface RouteLoadSamples {
  cold?: number;
  warm?: number;
}

export type LoadHistory = Record<string, RouteLoadSamples>;

export type LoadPath = { path: 'fast' } | { path: 'draw'; drawMs: number };

export const DEFAULT_COLD_MS = 1200;
export const DEFAULT_WARM_MS = 250;
/** Extra cost when the zodiac enhancement JSON is not cached yet. */
export const ASSET_FETCH_MS = 300;
/** At or below this estimate only the static artwork is shown (no drawing). */
export const FAST_PATH_MAX_MS = 300;
export const MIN_DRAW_MS = 700;
export const MAX_DRAW_MS = 4800;
/** When the page becomes ready mid-drawing the remainder is finished within this time. */
export const FINISH_NOW_MS = 300;
/** A fast-path route still loading after this long switches to a drawing. */
export const FAST_UPGRADE_MS = 450;
export const FAST_UPGRADE_DRAW_MS = 1500;

const SMOOTHING = 0.4;
const MAX_SAMPLE_MS = 8000;

export function estimateLoadMs(options: {
  history: LoadHistory;
  pathname: string;
  kind: LoadKind;
  assetCached: boolean;
}): number {
  const { history, pathname, kind, assetCached } = options;
  const sample = history[pathname]?.[kind];
  const base = sample ?? (kind === 'cold' ? DEFAULT_COLD_MS : DEFAULT_WARM_MS);
  // Cold samples already include the asset fetch; a warm route with an uncached sign still pays it.
  return kind === 'warm' && !assetCached ? base + ASSET_FETCH_MS : base;
}

export function decideLoadPath(estimateMs: number): LoadPath {
  if (estimateMs <= FAST_PATH_MAX_MS) {
    return { path: 'fast' };
  }
  return { path: 'draw', drawMs: Math.min(MAX_DRAW_MS, Math.max(MIN_DRAW_MS, estimateMs)) };
}

export function recordLoadMs(
  history: LoadHistory,
  pathname: string,
  kind: LoadKind,
  durationMs: number,
): LoadHistory {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return history;
  }
  const sample = Math.min(MAX_SAMPLE_MS, durationMs);
  const previous = history[pathname]?.[kind];
  const next = previous === undefined ? sample : previous + (sample - previous) * SMOOTHING;
  return { ...history, [pathname]: { ...history[pathname], [kind]: Math.round(next) } };
}

export function parseLoadHistory(raw: string | null): LoadHistory {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const result: LoadHistory = {};
    for (const [pathname, value] of Object.entries(parsed)) {
      if (typeof value !== 'object' || value === null) continue;
      const entry = value as Record<string, unknown>;
      const samples: RouteLoadSamples = {};
      if (typeof entry.cold === 'number' && Number.isFinite(entry.cold)) samples.cold = entry.cold;
      if (typeof entry.warm === 'number' && Number.isFinite(entry.warm)) samples.warm = entry.warm;
      result[pathname] = samples;
    }
    return result;
  } catch {
    return {};
  }
}
