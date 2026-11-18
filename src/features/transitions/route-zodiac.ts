import { getFeatureAccentVar } from '@/features/home/feature-collection/feature-accent';
import { FEATURE_REGISTRY } from '@/features/registry';
import type { ZodiacSign } from '@/features/zodiac/types';
import { normalizePathname } from './transition-rules';

/**
 * Destination zodiac for the route loading overlay (v3.1 §3.2).
 * Daily and Tasks Hub share Aries; every other mapped feature keeps its registry sign.
 * Routes without a mapped sign (including Home) use the neutral loader.
 * The registry itself is not changed, so collection membership and identity stay intact.
 */
const ROUTE_SIGN_OVERRIDES: Readonly<Record<string, ZodiacSign>> = {
  '/tasks/daily': 'aries',
  '/tasks/hub': 'aries',
  '/events': 'taurus',
};

export function getRouteZodiacSign(pathname: string): ZodiacSign | null {
  const normalized = normalizePathname(pathname);
  const override = ROUTE_SIGN_OVERRIDES[normalized];
  if (override) return override;
  const feature = FEATURE_REGISTRY.find((entry) => entry.href === normalized);
  return feature?.thumbnail.zodiacSign ?? null;
}

/** Titles for destinations that are not part of the feature registry. */
const EXTRA_ROUTE_TITLES: Readonly<Record<string, string>> = {
  '/notifications': 'Notifications',
};

function findRouteFeature(normalized: string) {
  return FEATURE_REGISTRY.find((entry) => entry.href === normalized);
}

/** Loader text is "Loading {page title}" (the dots are drawn by the overlay). */
export function getRouteLoadingLabel(pathname: string): string {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return 'Loading home';
  const title = findRouteFeature(normalized)?.title ?? EXTRA_ROUTE_TITLES[normalized];
  return title ? `Loading ${title}` : 'Loading page';
}

/** Per-feature glow accent so the loader background matches the collection card thumbnail. */
export function getRouteAccent(pathname: string): string {
  const feature = findRouteFeature(normalizePathname(pathname));
  return feature ? getFeatureAccentVar(feature) : 'var(--cosmos-lavender)';
}

/**
 * Routes that show the loader on a hard load or refresh: mapped features and known extras.
 * Home keeps its own intro; unknown routes (404s, previews) are left alone.
 */
export function isHardLoadRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return false;
  return (
    getRouteZodiacSign(normalized) !== null ||
    findRouteFeature(normalized) !== undefined ||
    normalized in EXTRA_ROUTE_TITLES
  );
}
