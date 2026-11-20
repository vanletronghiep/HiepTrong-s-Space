import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HIDDEN_ROUTES, isRouteHidden } from '@/domain/feature-visibility';
import { FEATURE_REGISTRY, VISIBLE_FEATURES } from '@/features/registry';
import { getRouteLoaderTitle, isHardLoadRoute } from '@/features/transitions/route-zodiac';

const HIDDEN = [
  '/ai-engineering',
  '/apcs',
  '/flashcards',
  '/entertainment',
  '/milestones',
  '/achievements',
];

describe('feature visibility', () => {
  it('hides the six paused pages and only those', () => {
    expect([...HIDDEN_ROUTES].sort()).toEqual([...HIDDEN].sort());
    expect(isRouteHidden('/flashcards')).toBe(true);
    expect(isRouteHidden('/flashcards/')).toBe(true);
    expect(isRouteHidden('/events')).toBe(false);
    expect(isRouteHidden('/')).toBe(false);
  });

  it('keeps the full registry and removes hidden pages from the visible list', () => {
    expect(FEATURE_REGISTRY).toHaveLength(13);
    expect(VISIBLE_FEATURES.map((f) => f.href)).toEqual([
      '/tasks/daily',
      '/tasks/hub',
      '/events',
      '/writing',
      '/tracking',
      '/focus',
      '/focus-room',
    ]);
  });

  it('keeps code for hidden pages so they can be reactivated', () => {
    for (const route of HIDDEN) {
      const page = path.resolve(
        process.cwd(),
        'src',
        'app',
        '(workspace)',
        route.slice(1),
        'page.tsx',
      );
      expect(existsSync(page), `Missing page for ${route}`).toBe(true);
    }
  });

  it('gives hidden routes no loader, so a hard load goes straight to the 404', () => {
    for (const route of HIDDEN) {
      expect(isHardLoadRoute(route)).toBe(false);
      expect(getRouteLoaderTitle(route)).toBe('Page');
    }
    expect(isHardLoadRoute('/events')).toBe(true);
  });
});
