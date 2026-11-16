import { compileZodiacLayerSchedule, compileZodiacSchedule } from './schedule';
import type {
  CompiledZodiacSchedule,
  ZodiacEnhancementData,
  ZodiacSign,
  ZodiacWordmarkData,
} from './types';

export interface LoadedZodiacAsset {
  data: ZodiacEnhancementData;
  schedule: CompiledZodiacSchedule;
  wordmarkSchedule?: CompiledZodiacSchedule;
}

const loadedCache = new Map<ZodiacSign, LoadedZodiacAsset>();
const inFlightCache = new Map<ZodiacSign, Promise<LoadedZodiacAsset>>();

export function getZodiacCanonicalSvgUrl(sign: ZodiacSign): string {
  return `/visuals/zodiac/${sign}.svg`;
}

export function getZodiacWordmarkSvgUrl(sign: ZodiacSign): string {
  return `/visuals/zodiac/${sign}-wordmark.svg`;
}

export function getZodiacEnhancementUrl(sign: ZodiacSign): string {
  return `/visuals/zodiac/${sign}-enhancement.json`;
}

function isValidWordmarkData(raw: unknown): raw is ZodiacWordmarkData {
  if (!raw || typeof raw !== 'object') return false;
  const wm = raw as Partial<ZodiacWordmarkData>;
  return (
    typeof wm.text === 'string' &&
    wm.text.length > 0 &&
    typeof wm.canonicalPath === 'string' &&
    wm.canonicalPath.length > 0 &&
    Boolean(wm.viewBox) &&
    typeof wm.viewBox?.width === 'number' &&
    typeof wm.viewBox?.height === 'number' &&
    Boolean(wm.gradient) &&
    Array.isArray(wm.gradient?.stops) &&
    Array.isArray(wm.roots) &&
    Array.isArray(wm.branches) &&
    Array.isArray(wm.fillRegions)
  );
}

function isValidZodiacData(raw: unknown, expectedSign: ZodiacSign): raw is ZodiacEnhancementData {
  if (!raw || typeof raw !== 'object') return false;
  const candidate = raw as Partial<ZodiacEnhancementData>;
  if (candidate.wordmark !== undefined && !isValidWordmarkData(candidate.wordmark)) {
    return false;
  }
  return (
    candidate.version === 1 &&
    candidate.sign === expectedSign &&
    typeof candidate.canonicalPath === 'string' &&
    candidate.canonicalPath.length > 0 &&
    typeof candidate.sourceSha256 === 'string' &&
    Boolean(candidate.viewBox) &&
    typeof candidate.viewBox?.width === 'number' &&
    typeof candidate.viewBox?.height === 'number' &&
    Boolean(candidate.gradient) &&
    Array.isArray(candidate.gradient?.stops) &&
    Array.isArray(candidate.roots) &&
    Array.isArray(candidate.branches) &&
    Array.isArray(candidate.fillRegions) &&
    Boolean(candidate.completedGlowRoute)
  );
}

/**
 * Synchronously returns already-loaded enhancement data and compiled schedule if cached.
 */
export function getCachedZodiacAsset(sign: ZodiacSign): LoadedZodiacAsset | null {
  return loadedCache.get(sign) ?? null;
}

/**
 * Lazily fetches, validates, compiles, and caches per-sign zodiac enhancement data.
 * Deduplicates concurrent requests for the same sign.
 */
export async function loadZodiacEnhancement(sign: ZodiacSign): Promise<LoadedZodiacAsset> {
  const cached = loadedCache.get(sign);
  if (cached) return cached;

  const existingPromise = inFlightCache.get(sign);
  if (existingPromise) return existingPromise;

  const request = (async (): Promise<LoadedZodiacAsset> => {
    if (typeof fetch !== 'function') {
      throw new Error('Fetch API is unavailable in this environment.');
    }
    const response = await fetch(getZodiacEnhancementUrl(sign), {
      credentials: 'same-origin',
    });
    if (!response.ok) {
      throw new Error(`Failed to load zodiac enhancement for ${sign}: HTTP ${response.status}`);
    }
    const raw: unknown = await response.json();
    if (!isValidZodiacData(raw, sign)) {
      throw new Error(`Invalid zodiac enhancement payload for ${sign}`);
    }
    const schedule = compileZodiacSchedule(raw);
    const wordmarkSchedule = raw.wordmark
      ? compileZodiacLayerSchedule(sign, raw.wordmark)
      : undefined;
    const asset: LoadedZodiacAsset = { data: raw, schedule, wordmarkSchedule };
    loadedCache.set(sign, asset);
    return asset;
  })();

  inFlightCache.set(sign, request);
  try {
    return await request;
  } finally {
    inFlightCache.delete(sign);
  }
}

/**
 * Fire-and-forget preloader for isolated preview or near-viewport preloading.
 * Never throws; returns `null` if loading fails so callers can safely fall back to static SVG.
 */
export async function preloadZodiacEnhancement(
  sign: ZodiacSign,
): Promise<LoadedZodiacAsset | null> {
  try {
    return await loadZodiacEnhancement(sign);
  } catch {
    return null;
  }
}

/**
 * Clears in-memory enhancement and in-flight caches (intended for tests).
 */
export function clearZodiacLoaderCache(): void {
  loadedCache.clear();
  inFlightCache.clear();
}
