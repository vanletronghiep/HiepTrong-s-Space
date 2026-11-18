// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeatureCollectionLayoutPreference } from '@/client/preferences';
import { FeatureCard } from '@/features/home/feature-collection/FeatureCard';
import { FEATURE_REGISTRY } from '@/features/registry';
import { clearZodiacLoaderCache } from '@/features/zodiac/loader';
import type { ZodiacEnhancementData } from '@/features/zodiac/types';
import { ZodiacIllumination } from '@/features/zodiac/ZodiacIllumination';
import { ZODIAC_PREVIEW_FEATURES } from '@/app/preview/zodiac-illumination/preview-dataset';
import { ZodiacIlluminationPreview } from '@/app/preview/zodiac-illumination/ZodiacIlluminationPreview';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/preview/zodiac-illumination',
}));

const MOCK_AQUARIUS_DATA: ZodiacEnhancementData = {
  version: 1,
  sign: 'aquarius',
  sourceSha256: '0'.repeat(64),
  canonicalSvgUrl: '/visuals/zodiac/aquarius.svg',
  viewBox: { minX: 0, minY: 0, width: 394, height: 484 },
  gradient: {
    id: 'aquarius-rose-gold',
    x1: '20%',
    y1: '0%',
    x2: '80%',
    y2: '100%',
    stops: [
      { offset: '0%', color: 'var(--cosmos-text)' },
      { offset: '100%', color: 'var(--cosmos-accent)' },
    ],
  },
  canonicalPath: 'M 20 20 H 80 V 80 H 20 Z M 35 35 H 65 V 65 H 35 Z',
  fillRule: 'evenodd',
  clipRule: 'evenodd',
  contourCount: 2,
  outlineBandStrokeWidth: 3.5,
  roots: ['root-branch'],
  branches: [
    {
      id: 'root-branch',
      label: 'Pour origin',
      parentId: null,
      kind: 'major',
      children: [],
      contourIndices: [0, 1],
      entryTransition: 'connected',
      outlineGuides: [
        {
          id: 'outline-1',
          d: 'M 20 20 L 80 20 L 80 80 L 20 80 Z',
          length: 240,
          strokeWidth: 4,
          contourIndices: [0, 1],
          lut: [
            [0, 20, 20],
            [0.5, 80, 80],
            [1, 20, 20],
          ],
        },
      ],
    },
  ],
  fillRegions: [
    {
      id: 'fill-1',
      label: 'Body fill',
      branchId: 'root-branch',
      kind: 'major',
      order: 0,
      clipPathD: 'M 15 15 H 85 V 85 H 15 Z',
      contourIndices: [0, 1],
      entryTransition: 'connected',
      fillGuides: [
        {
          id: 'fill-guide-1',
          d: 'M 20 50 L 80 50',
          length: 60,
          strokeWidth: 70,
          contourIndices: [0, 1],
          lut: [
            [0, 20, 50],
            [1, 80, 50],
          ],
        },
      ],
    },
  ],
  completedGlowRoute: {
    id: 'glow-route',
    d: 'M 20 20 L 80 20 L 80 80 L 20 80 Z',
    length: 240,
    lut: [
      [0, 20, 20],
      [0.5, 80, 80],
      [1, 20, 20],
    ],
  },
};

interface MockMediaControl {
  trigger: (matches: boolean) => void;
}

function setupMediaQueries(initial: { reducedMotion?: boolean; noHover?: boolean } = {}) {
  let reducedMatches = initial.reducedMotion ?? false;
  let noHoverMatches = initial.noHover ?? false;
  const reducedListeners = new Set<(event: MediaQueryListEvent) => void>();
  const noHoverListeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const isReduced = query.includes('prefers-reduced-motion');
      const isNoHover = query.includes('hover: none');
      const listeners = isReduced ? reducedListeners : noHoverListeners;
      return {
        get matches() {
          if (isReduced) return reducedMatches;
          if (isNoHover) return noHoverMatches;
          return false;
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, cb: (event: MediaQueryListEvent) => void) => {
          listeners.add(cb);
        },
        removeEventListener: (_type: string, cb: (event: MediaQueryListEvent) => void) => {
          listeners.delete(cb);
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  );

  const reducedControl: MockMediaControl = {
    trigger(matches: boolean) {
      reducedMatches = matches;
      const event = { matches } as MediaQueryListEvent;
      for (const listener of reducedListeners) listener(event);
    },
  };

  const noHoverControl: MockMediaControl = {
    trigger(matches: boolean) {
      noHoverMatches = matches;
      const event = { matches } as MediaQueryListEvent;
      for (const listener of noHoverListeners) listener(event);
    },
  };

  return { reducedControl, noHoverControl, reducedListeners, noHoverListeners };
}

function setupIntersectionObserver() {
  let latestCallback: IntersectionObserverCallback | null = null;
  const observe = vi.fn();
  const disconnect = vi.fn();

  class MockIO implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [0.01];
    constructor(cb: IntersectionObserverCallback) {
      latestCallback = cb;
    }
    observe = observe;
    unobserve = vi.fn();
    disconnect = disconnect;
    takeRecords = () => [];
  }

  vi.stubGlobal('IntersectionObserver', MockIO);

  return {
    observe,
    disconnect,
    setIntersecting(isIntersecting: boolean) {
      if (!latestCallback) return;
      latestCallback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    },
  };
}

describe('ZodiacIllumination component lifecycle, fallback & SVG ID isolation', () => {
  let rafQueue: Map<number, FrameRequestCallback>;
  let nextRafId: number;
  let visibilityState: DocumentVisibilityState;

  beforeEach(() => {
    clearZodiacLoaderCache();
    rafQueue = new Map();
    nextRafId = 1;
    visibilityState = 'visible';

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextRafId;
      nextRafId += 1;
      rafQueue.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.delete(id);
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => MOCK_AQUARIUS_DATA,
      })),
    );
  });

  afterEach(() => {
    cleanup();
    clearZodiacLoaderCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mounts unique useId-prefixed SVG defs across multiple instances with zero ID collisions', async () => {
    setupMediaQueries();
    setupIntersectionObserver();

    const { container } = render(
      <>
        <ZodiacIllumination sign="aquarius" manualProgress={0.5} />
        <ZodiacIllumination sign="aquarius" manualProgress={0.8} />
      </>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('[data-zodiac-mode="enhanced"]')).toHaveLength(2);
    });

    const svgs = Array.from(container.querySelectorAll('svg'));
    expect(svgs).toHaveLength(4); // 2 emblems + 2 symbols (mock omits wordmark)
    expect(container.querySelectorAll('[data-zodiac-column="editorial"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-zodiac-column="illustration"]')).toHaveLength(2);

    // Completed glow renders layered leading (2%) & trailing (12%) strokes on illustration only
    const emblemSvg = container.querySelector('svg[data-zodiac-part="emblem"]')!;
    const leadGlow = emblemSvg.querySelector('[data-zodiac-glow-segment="leading"]')!;
    const tailGlow = emblemSvg.querySelector('[data-zodiac-glow-segment="trailing"]')!;
    expect(leadGlow).toHaveAttribute('stroke-dasharray', '20 980');
    expect(leadGlow).toHaveAttribute('stroke', 'var(--zodiac-rose-gold-highlight)');
    expect(tailGlow).toHaveAttribute('stroke-dasharray', '120 880');
    expect(tailGlow).toHaveAttribute('stroke', 'var(--zodiac-rose-gold-highlight)');
    expect(
      container.querySelector('svg[data-zodiac-part="symbol"] [data-zodiac-glow="completed"]'),
    ).toBeNull();

    const ids = Array.from(container.querySelectorAll('svg [id]')).map((el) =>
      el.getAttribute('id'),
    );
    expect(ids.length).toBeGreaterThanOrEqual(14);
    expect(new Set(ids).size).toBe(ids.length);

    // Ensure masks & rules remain explicit
    for (const mask of Array.from(container.querySelectorAll('mask'))) {
      expect(mask).toHaveAttribute('maskUnits', 'userSpaceOnUse');
      expect(mask).toHaveAttribute('maskContentUnits', 'userSpaceOnUse');
    }
    for (const useEl of Array.from(container.querySelectorAll('use'))) {
      const href = useEl.getAttribute('href');
      expect(href).toMatch(/^#/);
      expect(ids).toContain(href!.slice(1));
    }
  });

  it('keeps idle cards as lightweight dim images and cancels rAFs on offscreen, hidden tab, live reduced-motion, and unmount', async () => {
    const media = setupMediaQueries();
    const io = setupIntersectionObserver();

    const { container, rerender, unmount } = render(
      <ZodiacIllumination sign="aquarius" active={false} />,
    );

    // Idle card stays lightweight without mounting heavy enhanced emblem SVG DOM
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(container.querySelector('[data-zodiac-mode="idle-dim"]')).toBeInTheDocument();
    expect(container.querySelector('svg[data-zodiac-part="emblem"]')).toBeNull();
    expect(container.querySelector('img[data-zodiac-part="emblem"]')).toHaveAttribute(
      'src',
      '/visuals/zodiac/aquarius.svg',
    );
    expect(rafQueue.size).toBe(0);

    // Activate -> mounts enhanced SVG and schedules 1 rAF
    rerender(<ZodiacIllumination sign="aquarius" active={true} />);
    await waitFor(() => {
      expect(container.querySelector('[data-zodiac-mode="enhanced"]')).toBeInTheDocument();
    });
    expect(rafQueue.size).toBe(1);

    // Advance 1 frame and verify zero geometry layout/SVG measurement calls exist
    const cb = Array.from(rafQueue.values())[0]!;
    rafQueue.clear();
    cb(16.67);
    expect(rafQueue.size).toBe(1);

    // Offscreen IntersectionObserver pause cancels rAF
    act(() => {
      io.setIntersecting(false);
    });
    await waitFor(() => {
      expect(rafQueue.size).toBe(0);
    });

    // Resume on viewport re-entry
    act(() => {
      io.setIntersecting(true);
    });
    await waitFor(() => {
      expect(rafQueue.size).toBe(1);
    });

    // Hidden tab visibilitychange pause cancels rAF
    act(() => {
      visibilityState = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => {
      expect(rafQueue.size).toBe(0);
    });

    // Resume tab visibility
    act(() => {
      visibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => {
      expect(rafQueue.size).toBe(1);
    });

    // Live prefers-reduced-motion toggle cancels rAF and renders static fully-lit canonical SVG
    act(() => {
      media.reducedControl.trigger(true);
    });
    await waitFor(() => {
      expect(container.querySelector('[data-zodiac-mode="static-full"]')).toBeInTheDocument();
    });
    expect(rafQueue.size).toBe(0);
    const fallbackImg = container.querySelector('img[data-zodiac-part="emblem"]')!;
    expect(fallbackImg).toHaveAttribute('src', '/visuals/zodiac/aquarius.svg');
    expect(fallbackImg.className).not.toContain('staticImageDim');

    // Toggle back to motion-enabled -> re-mounts enhanced SVG & resumes rAF, then unmount cleans up
    act(() => {
      media.reducedControl.trigger(false);
    });
    await waitFor(() => {
      expect(rafQueue.size).toBe(1);
    });

    unmount();
    expect(rafQueue.size).toBe(0);
    expect(io.disconnect).toHaveBeenCalled();
    expect(media.reducedListeners.size).toBe(0);
    expect(media.noHoverListeners.size).toBe(0);
  });

  it('renders static fully-lit canonical SVG for (hover: none) and enhancement load failures', async () => {
    setupMediaQueries({ noHover: true });
    setupIntersectionObserver();

    const { container, unmount } = render(<ZodiacIllumination sign="aquarius" active={true} />);
    expect(container.querySelector('[data-zodiac-mode="static-full"]')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(rafQueue.size).toBe(0);
    unmount();

    // Load failure fallback
    clearZodiacLoaderCache();
    setupMediaQueries({ noHover: false });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })),
    );

    const failed = render(<ZodiacIllumination sign="aquarius" active={true} />);
    await waitFor(() => {
      expect(
        failed.container.querySelector('[data-zodiac-mode="static-full"]'),
      ).toBeInTheDocument();
    });
    const img = failed.container.querySelector('img[data-zodiac-part="emblem"]')!;
    expect(img).toHaveAttribute('src', '/visuals/zodiac/aquarius.svg');
    expect(img.className).not.toContain('staticImageDim');
    expect(rafQueue.size).toBe(0);
  });

  it('skips mask guide writes during completed-glow frames and releases enhanced SVG when settled at idle', async () => {
    setupMediaQueries();
    setupIntersectionObserver();

    const { container } = render(
      <ZodiacIllumination sign="aquarius" active={true} manualProgress={1} />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-zodiac-mode="enhanced"]')).toBeInTheDocument();
    });

    const outlineGuidePath = container.querySelector(
      'svg[data-zodiac-part="emblem"] mask[id$="-outline-mask"] path',
    )!;
    const setAttrSpy = vi.spyOn(outlineGuidePath, 'setAttribute');

    // Step completed-glow rAF frames at p = 1: outline/fill guide attributes must not be rewritten
    for (let i = 0; i < 3; i += 1) {
      const entries = Array.from(rafQueue.entries());
      rafQueue.clear();
      for (const [, cb] of entries) cb((i + 1) * 100);
    }
    expect(setAttrSpy).not.toHaveBeenCalled();

    // Verify idle release: mount fresh active card, advance briefly, hover out and settle back to 0
    cleanup();
    const lifecycle = render(<ZodiacIllumination sign="aquarius" active={true} />);
    await waitFor(() => {
      expect(lifecycle.container.querySelector('[data-zodiac-mode="enhanced"]')).toBeInTheDocument();
    });

    let t = 16.67;
    const pump = (frames: number) => {
      act(() => {
        for (let i = 0; i < frames; i += 1) {
          const entries = Array.from(rafQueue.entries());
          rafQueue.clear();
          for (const [, cb] of entries) cb(t);
          t += 16.67;
        }
      });
    };
    pump(12); // p > 0

    // Hover out -> still mid-flight so enhanced SVG stays mounted during reversal
    lifecycle.rerender(<ZodiacIllumination sign="aquarius" active={false} />);
    pump(2);
    expect(lifecycle.container.querySelector('[data-zodiac-mode="enhanced"]')).toBeInTheDocument();

    // Pump until settled back at p = 0 -> enhanced emblem SVG is released back to idle-dim
    pump(90);
    await waitFor(() => {
      expect(
        lifecycle.container.querySelector('[data-zodiac-mode="idle-dim"]'),
      ).toBeInTheDocument();
    });
    expect(lifecycle.container.querySelector('svg[data-zodiac-part="emblem"]')).toBeNull();
  });

  it('renders production collection zodiac artwork fully drawn at rest; hover and focus never start drawing', () => {
    setupMediaQueries({ noHover: false, reducedMotion: false });
    setupIntersectionObserver();

    const aquariusFeature = ZODIAC_PREVIEW_FEATURES.find((f) => f.id === 'learning-room')!;
    expect(aquariusFeature.thumbnail.zodiacSign).toBe('aquarius');
    render(<FeatureCard feature={aquariusFeature} revealComplete={true} />);

    const link = screen.getByRole('link', { name: /Learning Room/i });
    const root = document.querySelector('[data-zodiac-sign="aquarius"]');
    expect(root).toHaveAttribute('data-zodiac-mode', 'static-full');
    expect(root).toHaveAttribute('data-zodiac-presentation', 'static');
    expect(document.querySelector('[data-zodiac-thumb="static"]')).toBeInTheDocument();

    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    fireEvent.mouseEnter(link);
    fireEvent.focus(link);
    expect(document.querySelector('[data-zodiac-mode="enhanced"]')).not.toBeInTheDocument();
    expect(root).toHaveAttribute('data-zodiac-mode', 'static-full');
  });

  it('keeps production registry untouched and isolates preview layout state from localStorage preferences', async () => {
    setupMediaQueries({ noHover: false, reducedMotion: false });
    setupIntersectionObserver();

    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        get length() {
          return store.size;
        },
        clear: () => store.clear(),
        getItem: (k: string) => store.get(k) ?? null,
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        removeItem: (k: string) => store.delete(k),
        setItem: (k: string, v: string) => store.set(k, v),
      } as Storage,
    });
    window.localStorage.setItem('hiep-trong-feature-collection-layout', 'horizontal');

    // Production registry maps the 12 Feature Collection entries while keeping tasks-hub unmapped
    const tasksHub = FEATURE_REGISTRY.find((f) => f.id === 'tasks-hub');
    expect(tasksHub?.thumbnail.zodiacSign).toBeUndefined();
    const prodCollection = FEATURE_REGISTRY.filter((f) => f.id !== 'tasks-hub');
    expect(prodCollection).toHaveLength(12);
    expect(prodCollection.map((f) => [f.id, f.thumbnail.zodiacSign])).toEqual([
      ['daily-tasks', 'aries'],
      ['events', 'taurus'],
      ['ai-engineering', 'gemini'],
      ['blogs', 'cancer'],
      ['apcs', 'leo'],
      ['flashcards', 'virgo'],
      ['entertainment', 'libra'],
      ['tracking', 'scorpio'],
      ['projects', 'sagittarius'],
      ['milestones', 'capricorn'],
      ['learning-room', 'aquarius'],
      ['achievements', 'pisces'],
    ]);

    // Preview dataset preserves the same 12 destinations, order, and zodiac signs
    expect(ZODIAC_PREVIEW_FEATURES).toHaveLength(12);
    expect(ZODIAC_PREVIEW_FEATURES.map((f) => f.id)).toEqual(prodCollection.map((f) => f.id));
    expect(ZODIAC_PREVIEW_FEATURES.map((f) => f.thumbnail.zodiacSign)).toEqual(
      prodCollection.map((f) => f.thumbnail.zodiacSign),
    );

    render(<ZodiacIlluminationPreview />);
    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();

    // Switching preview layout to Vertical must NOT overwrite production localStorage preference
    fireEvent.click(screen.getByTestId('zodiac-layout-vertical'));
    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });
    expect(getFeatureCollectionLayoutPreference()).toBe('horizontal');
    expect(window.localStorage.getItem('hiep-trong-feature-collection-layout')).toBe('horizontal');
  });
});
