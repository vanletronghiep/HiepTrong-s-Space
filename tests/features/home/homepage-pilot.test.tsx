// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeatureCollectionLayoutPreference } from '@/client/preferences';
import { HomepagePilotPrototype } from '@/app/preview/homepage-pilot/HomepagePilotPrototype';
import {
  PILOT_FEATURES,
  PILOT_INTRO_COPY,
  PILOT_LAYOUT_STORAGE_KEY,
  pilotEarthPose,
} from '@/app/preview/homepage-pilot/homepage-pilot-fixtures';
import { PilotFeatureCollection } from '@/app/preview/homepage-pilot/PilotFeatureCollection';
import { FEATURE_REGISTRY } from '@/features/registry';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/preview/homepage-pilot',
}));

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function stubMatchMedia(matcher: (query: string) => boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matcher(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('Homepage Pilot (/preview/homepage-pilot)', () => {
  beforeEach(() => {
    const memoryStorage = createMemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorage,
      configurable: true,
      writable: true,
    });
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('preserves exact introduction copy, 13 destinations in registry order, and footer', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { container } = render(<HomepagePilotPrototype />);

    const intro = container.querySelector('[data-pilot-intro]');
    expect(intro).not.toBeNull();
    expect(intro?.querySelector('button')).toBeNull();

    const introHeading = screen.getByRole('heading', { level: 2, name: PILOT_INTRO_COPY.heading });
    expect(introHeading).toHaveTextContent("Hi! I'm Hiep.");
    expect(screen.getByText(PILOT_INTRO_COPY.lead)).toBeInTheDocument();
    expect(screen.getByText(PILOT_INTRO_COPY.body)).toBeInTheDocument();
    expect(screen.getByText(PILOT_INTRO_COPY.closing)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Explore my space' })).toBeInTheDocument();
    expect(container.querySelector('[data-earth-bounds]')).not.toBeNull();
    expect(container.querySelector('[data-pilot-badge]')).toHaveTextContent('Pilot Preview');

    const links = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('#features a[data-feature-id]'),
    );
    expect(links).toHaveLength(13);
    expect(PILOT_FEATURES).toHaveLength(FEATURE_REGISTRY.length);
    FEATURE_REGISTRY.forEach((entry, index) => {
      expect(links[index]).toHaveAttribute('href', entry.href);
      expect(links[index]).toHaveAttribute('data-feature-id', entry.id);
      expect(links[index]).toHaveTextContent(entry.title);
      expect(links[index]).toHaveTextContent(entry.label);
    });

    expect(screen.getByText('Earth imagery credits')).toBeInTheDocument();

    // Fixture bell opens read-only popover without any API requests
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText(/Fixture preview/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('switches Horizontal and Vertical modes under the isolated pilot storage key without mutating production prefs', async () => {
    window.localStorage.setItem('hts.featureCollection.layout', 'horizontal');
    stubMatchMedia(() => false);

    render(<PilotFeatureCollection />);

    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();
    expect(window.localStorage.getItem(PILOT_LAYOUT_STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Vertical' }));
    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });

    expect(window.localStorage.getItem(PILOT_LAYOUT_STORAGE_KEY)).toBe('vertical');
    expect(getFeatureCollectionLayoutPreference()).toBe('horizontal');

    // Remount restores pilot key without affecting production key
    cleanup();
    render(<PilotFeatureCollection />);
    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });
    expect(getFeatureCollectionLayoutPreference()).toBe('horizontal');
  });

  it('activates pinned horizontal stage on desktop with fine pointer and respects reduced-motion static fallback', async () => {
    stubMatchMedia(
      (query) =>
        query === '(min-width: 1024px) and (min-height: 520px)' || query === '(pointer: fine)',
    );

    render(<PilotFeatureCollection />);
    await waitFor(() => {
      expect(screen.getByTestId('horizontal-pinned-outer')).toBeInTheDocument();
    });
    expect(screen.getByTestId('horizontal-pinned-track')).toBeInTheDocument();
    cleanup();

    // Reduced motion disables pinned scroll-driven horizontal track & continuous starfield rAF
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)');
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { rerender } = render(<HomepagePilotPrototype />);
    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();
    expect(screen.queryByTestId('horizontal-pinned-outer')).not.toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();

    rerender(<HomepagePilotPrototype />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('computes non-overlapping Earth framing across all 6 target viewports', () => {
    // Stacked viewports (< 1024px portrait): Earth bottom remains >= 24px above intro top
    for (const [width, height, introH] of [
      [768, 900, 260],
      [375, 812, 270],
      [320, 812, 296],
    ] as const) {
      const pose = pilotEarthPose(width, height, 0.78, introH);
      expect(pose.mode).toBe('stacked');
      const earthTop = pose.centerY - pose.diameter / 2;
      const earthBottom = pose.centerY + pose.diameter / 2;
      const introTop = height - (width < 768 ? 28 : 44) - introH;
      expect(earthTop).toBeGreaterThanOrEqual(width < 768 ? 76 : 102);
      expect(introTop - earthBottom).toBeGreaterThanOrEqual(24);
    }

    // Side-by-side desktop viewports: Earth right edge stays clearly left of 49vw intro column
    for (const [width, height] of [
      [1440, 900],
      [1024, 900],
    ] as const) {
      const pose = pilotEarthPose(width, height, 0.78, 260);
      expect(pose.mode).toBe('desktop');
      const earthRight = pose.centerX + pose.diameter / 2;
      expect(width * 0.49 - earthRight).toBeGreaterThanOrEqual(48);
    }

    // 1280 @ 200% zoom (640x360): compact landscape side-by-side keeps Earth left of 41vw intro
    const zoomed = pilotEarthPose(640, 360, 0.78, 210);
    expect(zoomed.mode).toBe('landscape-compact');
    expect(640 * 0.41 - (zoomed.centerX + zoomed.diameter / 2)).toBeGreaterThanOrEqual(24);
  });
});
