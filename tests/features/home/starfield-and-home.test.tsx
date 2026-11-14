// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as earthSceneModule from '@/features/home/earth-scene';
import { HomeJourney } from '@/features/home/HomeJourney';
import {
  formatRevealClipPath,
  getRevealRadius,
  HOME_INTRO_COPY,
} from '@/features/home/home-journey';
import {
  StarfieldEngine,
  computeTargetStarCount,
} from '@/features/home/starfield/starfield-engine';
import { ToastProvider } from '@/ui/Toast';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

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

class MockIntersectionObserver {
  public static instances: MockIntersectionObserver[] = [];
  public readonly observe = vi.fn();
  public readonly unobserve = vi.fn();
  public readonly disconnect = vi.fn();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  public trigger(isIntersecting: boolean, target: Element) {
    this.callback(
      [{ isIntersecting, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
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

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Homepage StarfieldEngine & HomeJourney', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalScrollY = window.scrollY;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      configurable: true,
      writable: true,
    });
    window.history.replaceState(null, '', '/');
    delete (document as unknown as Record<string, unknown>).hidden;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

  it('resumes scheduling RAF frames when reducedMotion is disabled after starting in reduced-motion mode (C13)', () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 1280 });
    Object.defineProperty(canvas, 'clientHeight', { value: 800 });
    const mockCtx = createMockCanvasContext();
    vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

    const engine = new StarfieldEngine({
      canvas,
      reducedMotion: true,
    });

    engine.start();
    expect(rafSpy).not.toHaveBeenCalled();

    // User disables prefers-reduced-motion while engine is started -> RAF loop must resume automatically
    engine.setReducedMotion(false);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    // Re-enabling reducedMotion pauses the loop again
    engine.setReducedMotion(true);
    engine.destroy();
  });

  it('pauses StarfieldEngine safely when document is hidden, offscreen, or paused and resumes when visible', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    let hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 1280 });
    Object.defineProperty(canvas, 'clientHeight', { value: 800 });
    const mockCtx = createMockCanvasContext();
    vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
    let nextRafId = 1;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => nextRafId++);
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const engine = new StarfieldEngine({ canvas, reducedMotion: false });
    engine.start();
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(engine.isAnimating()).toBe(true);

    // Tab becomes hidden -> pauses loop
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(engine.isAnimating()).toBe(false);

    // Tab becomes visible again -> resumes loop
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(rafSpy).toHaveBeenCalledTimes(2);
    expect(engine.isAnimating()).toBe(true);

    // Canvas leaves viewport -> pauses loop
    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();
    observer?.trigger(false, canvas);
    expect(cancelSpy).toHaveBeenCalledTimes(2);
    expect(engine.isAnimating()).toBe(false);

    // Canvas re-enters viewport -> resumes loop
    observer?.trigger(true, canvas);
    expect(rafSpy).toHaveBeenCalledTimes(3);
    expect(engine.isAnimating()).toBe(true);

    // Explicit pause/resume
    engine.setPaused(true);
    expect(engine.isAnimating()).toBe(false);
    engine.setPaused(false);
    expect(rafSpy).toHaveBeenCalledTimes(4);

    engine.destroy();
    expect(observer?.disconnect).toHaveBeenCalled();
  });

  it('renders borderless HomeJourney intro copy, non-interactive hidden initial state, and reduced-motion static fallback', () => {
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)');
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], unreadCount: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { container } = renderWithQueryClient(<HomeJourney />);

    const intro = container.querySelector<HTMLElement>('[data-home-intro]');
    expect(intro).not.toBeNull();
    expect(intro).toHaveAttribute('data-home-intro-visible', 'false');
    expect(intro?.querySelector('button')).toBeNull();

    expect(screen.getByText(HOME_INTRO_COPY.eyebrow)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: HOME_INTRO_COPY.heading }),
    ).toBeInTheDocument();
    expect(intro?.querySelector('p')).toHaveTextContent(HOME_INTRO_COPY.lead);
    expect(intro?.querySelectorAll('p')[1]).toHaveTextContent(HOME_INTRO_COPY.body);
    expect(Array.from(intro?.querySelectorAll('strong') ?? [], (node) => node.textContent)).toEqual(
      ['Advanced Program in Computer Science', 'HCMUS.', 'AI', 'Machine Learning'],
    );
    expect(screen.getByText(HOME_INTRO_COPY.closing)).toBeInTheDocument();

    expect(container.querySelector('[data-earth-bounds]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByText('Earth imagery credits')).toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('reveals intro and hides Earth at collection scroll under reduced-motion without continuous RAF', () => {
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)');
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], unreadCount: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const queuedCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queuedCallbacks.push(cb);
      return queuedCallbacks.length;
    });

    const { container } = renderWithQueryClient(<HomeJourney />);
    const introSection = container.querySelector<HTMLElement>('section[aria-label="Introduction"]');
    const stage = introSection?.querySelector<HTMLElement>('div[data-home-hydrated="true"]');
    const introBlock = container.querySelector<HTMLElement>('[data-home-intro]');
    expect(introSection).not.toBeNull();
    expect(stage).not.toBeNull();
    expect(introBlock).not.toBeNull();

    Object.defineProperty(introSection!, 'offsetHeight', { configurable: true, value: 3600 });
    Object.defineProperty(stage!, 'clientWidth', { configurable: true, value: 1440 });
    Object.defineProperty(stage!, 'clientHeight', { configurable: true, value: 900 });
    window.dispatchEvent(new Event('resize'));
    expect(stage).toHaveAttribute('data-viewport-mode', 'desktop');
    expect(Number.parseFloat(introSection!.style.getPropertyValue('--earth-right'))).toBeCloseTo(
      559.8,
    );
    expect(Number.parseFloat(introSection!.style.getPropertyValue('--intro-left'))).toBeCloseTo(
      646.2,
    );

    // Scroll to intro beat (~65% of 2700px travel = 1755px)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1755 });
    window.dispatchEvent(new Event('scroll'));
    expect(queuedCallbacks).toHaveLength(1);
    queuedCallbacks.shift()?.(100);
    // Reduced motion completes in a single frame without rescheduling
    expect(queuedCallbacks).toHaveLength(0);
    expect(introBlock).toHaveAttribute('data-home-intro-visible', 'true');
    expect(stage).toHaveAttribute('data-earth-hidden', 'false');

    // Scroll to collection beat (100% of 2700px travel = 2700px) -> sticky stage still holds Earth
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2700 });
    window.dispatchEvent(new Event('scroll'));
    expect(queuedCallbacks).toHaveLength(1);
    queuedCallbacks.shift()?.(200);
    expect(queuedCallbacks).toHaveLength(0);
    expect(introBlock).toHaveAttribute('data-home-intro-visible', 'true');
    expect(introSection?.style.getPropertyValue('--intro-opacity')).toBe('1');
    expect(stage).toContainElement(introBlock);
    expect(introSection).toHaveAttribute('data-reveal-enabled', 'false');
    const surface = container.querySelector<HTMLElement>('[data-reveal-state]');
    const spacer = surface?.nextElementSibling as HTMLElement | null;
    expect(surface).toHaveAttribute('data-reveal-enabled', 'false');
    expect(spacer).toHaveAttribute('data-reveal-enabled', 'false');
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(surface).toHaveAttribute('data-reveal-state', 'revealed');
    expect(surface?.inert).toBe(false);
    expect(surface?.style.clipPath).toBe('');
    expect(surface?.style.transform).toBe('');
    expect(stage).toHaveAttribute('data-earth-hidden', 'false');

    // Scroll past the sticky intro stage (introTravel + height = 3600px) -> Earth hidden/paused
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3600 });
    window.dispatchEvent(new Event('scroll'));
    expect(queuedCallbacks).toHaveLength(1);
    queuedCallbacks.shift()?.(300);
    expect(queuedCallbacks).toHaveLength(0);
    expect(stage).toHaveAttribute('data-earth-hidden', 'true');
    expect(stage?.style.getPropertyValue('--earth-opacity')).toBe('0');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  it('orchestrates Midnight Galaxy circular reveal, stationary Earth/intro/collection, motion freeze, inert/focus guards, and upward WebGL re-entry', async () => {
    stubMatchMedia(() => false);
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], unreadCount: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind: string) =>
      kind === '2d' ? createMockCanvasContext() : null,
    );

    const earthRenderMock = vi.fn();
    vi.spyOn(earthSceneModule, 'createEarthScene').mockResolvedValue({
      render: earthRenderMock,
      dispose: vi.fn(),
    });
    const setPausedSpy = vi.spyOn(StarfieldEngine.prototype, 'setPaused');

    const rafQueue: Array<{ id: number; cb: FrameRequestCallback }> = [];
    let nextRafId = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextRafId;
      nextRafId += 1;
      rafQueue.push({ id, cb });
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      const idx = rafQueue.findIndex((entry) => entry.id === id);
      if (idx >= 0) {
        rafQueue.splice(idx, 1);
      }
    });

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 900,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    });

    const { container } = renderWithQueryClient(<HomeJourney />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const introSection = container.querySelector<HTMLElement>(
      'section[aria-label="Introduction"]',
    )!;
    const stage = introSection.querySelector<HTMLElement>('div[data-home-hydrated="true"]')!;
    const introBlock = container.querySelector<HTMLElement>('[data-home-intro]')!;
    const surface = container.querySelector<HTMLElement>('[data-reveal-state]')!;
    const spacer = surface.nextElementSibling as HTMLElement | null;
    const globeInput = container.querySelector<HTMLElement>('[data-earth-bounds]')!;
    const wordmark = container.querySelector<HTMLElement>('h1')!;
    const bellButton = screen.getByRole('button', { name: /Notifications/i });
    const homeButton = container.querySelector<HTMLButtonElement>('[data-collection-home]')!;
    const skipLink = screen.getByRole('link', { name: 'Skip to collection' });
    const featuresSection = container.querySelector<HTMLElement>('#features')!;

    expect(skipLink).toHaveAttribute('href', '#features');
    expect(stage).toContainElement(wordmark);
    expect(surface).not.toContainElement(wordmark);
    expect(surface).not.toContainElement(bellButton);
    expect(surface).toContainElement(homeButton);
    expect(screen.queryByRole('button', { name: /Universe/i })).toBeNull();

    Object.defineProperty(introSection, 'offsetHeight', { configurable: true, value: 4500 });
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 1440 });
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 900 });
    window.dispatchEvent(new Event('resize'));

    const flushFrames = (count: number, startTime = 100) => {
      act(() => {
        let t = startTime;
        for (let i = 0; i < count && rafQueue.length > 0; i += 1) {
          const entry = rafQueue.shift()!;
          entry.cb(t);
          t += 16.67;
        }
      });
    };

    // Initial state at scrollY = 0 -> hidden, inert, clipPath 0, native sticky (no inline transform), spacer enabled
    expect(introSection).toHaveAttribute('data-reveal-enabled', 'true');
    expect(surface).toHaveAttribute('data-reveal-enabled', 'true');
    expect(spacer).toHaveAttribute('data-reveal-enabled', 'true');
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(surface).toHaveAttribute('data-reveal-state', 'hidden');
    expect(surface).toHaveAttribute('data-reveal-progress', '0.0000');
    expect(surface.style.clipPath).toBe('circle(0px at 0px 900px)');
    expect(surface.style.transform).toBe('');
    expect(surface.inert).toBe(true);
    expect(surface).toHaveAttribute('aria-hidden', 'true');

    // Crossing revealStart (2600 settled -> 2850) keeps visualProgress (--nav-scrim) smooth without snapping
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2600 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(80, 100);
    const scrimBeforeRevealStart = Number.parseFloat(
      introSection.style.getPropertyValue('--nav-scrim'),
    );
    expect(scrimBeforeRevealStart).toBeGreaterThan(0.8);
    expect(scrimBeforeRevealStart).toBeLessThan(1);
    expect(surface).toHaveAttribute('data-reveal-state', 'hidden');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2850 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 1600);
    const scrimCrossingRevealStart = Number.parseFloat(
      introSection.style.getPropertyValue('--nav-scrim'),
    );
    expect(scrimCrossingRevealStart).toBeGreaterThan(scrimBeforeRevealStart);
    expect(scrimCrossingRevealStart).toBeLessThan(1);
    expect(surface.style.transform).toBe('');

    // Scroll back to revealStart = 2700 and settle -> Earth + About Me held beneath hidden surface
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2700 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(80, 1700);
    expect(surface).toHaveAttribute('data-reveal-state', 'hidden');
    expect(surface).toHaveAttribute('data-reveal-progress', '0.0000');
    expect(surface.style.transform).toBe('');
    expect(stage).toHaveAttribute('data-earth-hidden', 'false');
    expect(stage.style.getPropertyValue('--earth-opacity')).toBe('1');
    expect(introBlock).toHaveAttribute('data-home-intro-visible', 'true');

    // Scroll to 50% of reveal distance (2700 + 450 = 3150) -> advances partway on 1 frame, settles cleanly over frames
    setPausedSpy.mockClear();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3150 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 3200);

    const firstRevealStep = Number.parseFloat(surface.getAttribute('data-reveal-progress') ?? '0');
    expect(firstRevealStep).toBeGreaterThan(0);
    expect(firstRevealStep).toBeLessThan(0.5);
    expect(surface).toHaveAttribute('data-reveal-state', 'revealing');
    expect(surface.style.transform).toBe('');
    expect(surface.inert).toBe(true);
    expect(surface).toHaveAttribute('aria-hidden', 'true');
    expect(setPausedSpy).toHaveBeenCalledWith(true);

    flushFrames(80, 3220);
    const expectedMidClip = formatRevealClipPath(getRevealRadius(0.5, 1440, 900), 900);
    expect(surface).toHaveAttribute('data-reveal-state', 'revealing');
    expect(surface).toHaveAttribute('data-reveal-progress', '0.5000');
    expect(surface.style.clipPath).toBe(expectedMidClip);
    expect(surface.style.transform).toBe('');
    expect(surface.inert).toBe(true);
    expect(surface).toHaveAttribute('aria-hidden', 'true');
    expect(stage).toHaveAttribute('data-earth-hidden', 'false');
    expect(stage.style.getPropertyValue('--earth-opacity')).toBe('1');
    expect(introSection.style.getPropertyValue('--intro-opacity')).toBe('1');

    // Stopping scroll keeps radius unchanged (zero drift or auto-completion)
    const renderCountAtMid = earthRenderMock.mock.calls.length;
    window.dispatchEvent(new Event('scroll'));
    flushFrames(10, 4800);
    expect(surface.style.clipPath).toBe(expectedMidClip);
    expect(surface).toHaveAttribute('data-reveal-progress', '0.5000');
    expect(surface.style.transform).toBe('');
    expect(earthRenderMock.mock.calls.length).toBe(renderCountAtMid);

    // Rapid bidirectional reversal mid-reveal: 3150 settled -> 3400 (2 frames) -> 2900 -> settle -> 3150
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3400 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 5000);
    const revStep1 = Number.parseFloat(surface.getAttribute('data-reveal-progress') ?? '0');
    expect(revStep1).toBeGreaterThan(0.5);
    expect(revStep1).toBeLessThan(700 / 900);

    flushFrames(1, 5016.67);
    const revStep2 = Number.parseFloat(surface.getAttribute('data-reveal-progress') ?? '0');
    expect(revStep2).toBeGreaterThan(revStep1);
    expect(revStep2).toBeLessThan(700 / 900);
    expect(surface.style.transform).toBe('');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2900 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 5033.34);
    const turnAround = Number.parseFloat(surface.getAttribute('data-reveal-progress') ?? '0');
    expect(turnAround).toBeLessThan(revStep2);
    expect(turnAround).toBeGreaterThan(200 / 900);
    expect(surface.style.transform).toBe('');

    flushFrames(80, 5050);
    expect(surface).toHaveAttribute('data-reveal-progress', (200 / 900).toFixed(4));
    expect(surface.style.transform).toBe('');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3150 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(80, 6600);
    expect(surface).toHaveAttribute('data-reveal-progress', '0.5000');
    expect(surface.style.clipPath).toBe(expectedMidClip);

    // Earth keyboard/focus interaction is locked during partial reveal
    globeInput.focus();
    fireEvent.keyDown(globeInput, { key: 'ArrowRight' });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 8000);
    expect(document.activeElement).not.toBe(globeInput);
    expect(earthRenderMock.mock.calls.length).toBe(renderCountAtMid);

    // Complete reveal at scrollY = 3600 -> unclipped, non-inert, Earth covered, zero remount
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3600 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(80, 8200);
    expect(surface).toHaveAttribute('data-reveal-state', 'revealed');
    expect(surface).toHaveAttribute('data-reveal-progress', '1.0000');
    expect(surface.style.clipPath).toBe('');
    expect(surface.style.getPropertyValue('-webkit-clip-path')).toBe('');
    expect(surface.style.transform).toBe('');
    expect(surface.inert).toBe(false);
    expect(surface).not.toHaveAttribute('aria-hidden');
    expect(stage).toHaveAttribute('data-earth-hidden', 'true');
    expect(stage.style.getPropertyValue('--earth-opacity')).toBe('0');
    expect(container.querySelector('#features')).toBe(featuresSection);

    // Reverse scroll back to 3150 -> restores reveal clip smoothly without inline transform and forces one WebGL re-entry draw
    const renderCallsBeforeReentry = earthRenderMock.mock.calls.length;
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3150 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 9800);
    const reentryStep = Number.parseFloat(surface.getAttribute('data-reveal-progress') ?? '0');
    expect(reentryStep).toBeGreaterThan(0.5);
    expect(reentryStep).toBeLessThan(1);
    expect(surface).toHaveAttribute('data-reveal-state', 'revealing');
    expect(surface.style.transform).toBe('');
    expect(surface.inert).toBe(true);
    expect(stage).toHaveAttribute('data-earth-hidden', 'false');
    expect(stage.style.getPropertyValue('--earth-opacity')).toBe('1');
    expect(earthRenderMock.mock.calls.length).toBe(renderCallsBeforeReentry + 1);

    flushFrames(80, 9820);
    expect(surface).toHaveAttribute('data-reveal-progress', '0.5000');
    expect(surface.style.clipPath).toBe(expectedMidClip);
    expect(surface.style.transform).toBe('');

    // Reverse further to 2700 -> returns to hidden cleanly
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2700 });
    window.dispatchEvent(new Event('scroll'));
    flushFrames(80, 11400);
    expect(surface).toHaveAttribute('data-reveal-state', 'hidden');
    expect(surface).toHaveAttribute('data-reveal-progress', '0.0000');
    expect(surface.style.clipPath).toBe('circle(0px at 0px 900px)');
    expect(surface.style.transform).toBe('');
  });

  it('handles #features direct entry, skip link jump, and [data-collection-home] return-to-top cleanly', () => {
    stubMatchMedia(() => false);
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], unreadCount: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 900,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    });

    const scrollToSpy = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation((arg?: ScrollToOptions | number) => {
        if (typeof arg === 'object' && arg !== null && typeof arg.top === 'number') {
          Object.defineProperty(window, 'scrollY', {
            configurable: true,
            writable: true,
            value: arg.top,
          });
        }
      });

    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Direct entry at /#features lands on revealed collection and retains #features-heading focus
    window.history.replaceState(null, '', '/#features');
    const { container } = renderWithQueryClient(<HomeJourney />);
    const main = container.querySelector<HTMLElement>('main[data-home-journey]')!;
    const surface = container.querySelector<HTMLElement>('[data-reveal-state]')!;
    const heading = document.getElementById('features-heading')!;

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 3600, behavior: 'auto' });
    expect(surface).toHaveAttribute('data-reveal-state', 'revealed');
    expect(surface.inert).toBe(false);
    expect(document.activeElement).toBe(heading);

    // If initial browser fragment navigation drops focus back to body, next rAF restores heading focus
    heading.blur();
    expect(document.activeElement).toBe(document.body);
    while (rafCallbacks.length > 0) {
      rafCallbacks.shift()?.(16);
    }
    expect(document.activeElement).toBe(heading);

    // Clicking Hiep Trong signature button returns to top: 0, clears #features hash, and resets focus to <main>
    const homeButton = container.querySelector<HTMLButtonElement>('[data-collection-home]')!;
    homeButton.focus();
    fireEvent.click(homeButton);
    expect(window.location.hash).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(main);

    // Clicking Skip to collection from top jumps back to revealEnd and focuses #features-heading
    heading.blur();
    const skipLink = screen.getByRole('link', { name: 'Skip to collection' });
    fireEvent.click(skipLink);
    expect(window.location.hash).toBe('#features');
    expect(window.scrollY).toBe(3600);
    expect(surface).toHaveAttribute('data-reveal-state', 'revealed');
    expect(document.activeElement).toBe(heading);
  });

  it('falls back to ordinary document flow when CSS clip-path is unsupported', () => {
    stubMatchMedia(() => false);
    vi.stubGlobal('CSS', { supports: vi.fn(() => false) });
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], unreadCount: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const queuedCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queuedCallbacks.push(cb);
      return queuedCallbacks.length;
    });

    const { container } = renderWithQueryClient(<HomeJourney />);
    const introSection = container.querySelector<HTMLElement>(
      'section[aria-label="Introduction"]',
    )!;
    const stage = introSection.querySelector<HTMLElement>('div[data-home-hydrated="true"]')!;
    const surface = container.querySelector<HTMLElement>('[data-reveal-state]')!;

    Object.defineProperty(introSection, 'offsetHeight', { configurable: true, value: 3600 });
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 1440 });
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 900 });
    window.dispatchEvent(new Event('resize'));

    expect(introSection).toHaveAttribute('data-reveal-enabled', 'false');
    expect(surface).toHaveAttribute('data-reveal-enabled', 'false');
    const spacer = surface.nextElementSibling as HTMLElement | null;
    expect(spacer).toHaveAttribute('data-reveal-enabled', 'false');
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(surface).toHaveAttribute('data-reveal-state', 'revealed');
    expect(surface.inert).toBe(false);
    expect(surface).not.toHaveAttribute('aria-hidden');
    expect(surface.style.clipPath).toBe('');
    expect(surface.style.transform).toBe('');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2700 });
    window.dispatchEvent(new Event('scroll'));
    queuedCallbacks.shift()?.(100);
    expect(stage).toHaveAttribute('data-earth-hidden', 'false');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3600 });
    window.dispatchEvent(new Event('scroll'));
    queuedCallbacks.shift()?.(200);
    expect(stage).toHaveAttribute('data-earth-hidden', 'true');
  });
});
