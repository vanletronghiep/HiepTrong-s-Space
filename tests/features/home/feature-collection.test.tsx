// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeatureCollectionLayoutPreference } from '@/client/preferences';
import { FeatureCollection } from '@/features/home/feature-collection/FeatureCollection';
import { COLLECTION_SUBTITLE_COPY } from '@/features/home/home-journey';
import { HomeJourney } from '@/features/home/HomeJourney';
import { FEATURE_REGISTRY } from '@/features/registry';
import { ToastProvider } from '@/ui/Toast';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

const collectionFeatures = FEATURE_REGISTRY.filter((feature) => feature.id !== 'tasks-hub');
const intersectionObserveSpy = vi.fn();

class MockIntersectionObserver {
  observe = intersectionObserveSpy;
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

function renderWithHomeProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('FeatureCollection Horizontal & Vertical modes (§9.9 & ui_readme.md §11)', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalScrollY = window.scrollY;

  beforeEach(() => {
    intersectionObserveSpy.mockClear();
    const memoryStorage = createMemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorage,
      configurable: true,
      writable: true,
    });
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders all 12 feature cards in registry order in Horizontal fallback mode and switches to Vertical mode with persistence', async () => {
    render(<FeatureCollection />);

    const heading = screen.getByRole('heading', { name: 'My collection' });
    expect(heading).toBeInTheDocument();
    expect(heading.querySelector('span')).toHaveTextContent('collection');
    expect(screen.getByText(COLLECTION_SUBTITLE_COPY)).toBeInTheDocument();
    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(12);
    expect(links.some((link) => link.getAttribute('href') === '/tasks/hub')).toBe(false);
    expect(FEATURE_REGISTRY.find((feature) => feature.id === 'tasks-hub')?.href).toBe('/tasks/hub');
    collectionFeatures.forEach((entry, index) => {
      expect(links[index]).toHaveAttribute('href', entry.href);
      expect(links[index]).toHaveTextContent(entry.title);
      expect(links[index]).toHaveTextContent(entry.label);
    });

    // Switch to Vertical mode
    const gridToggle = screen.getByRole('button', { name: /switch to grid view/i });
    fireEvent.click(gridToggle);

    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('horizontal-native-gallery')).not.toBeInTheDocument();
    expect(getFeatureCollectionLayoutPreference()).toBe('vertical');

    const verticalLinks = screen.getAllByRole('link');
    expect(verticalLinks).toHaveLength(12);
    expect(verticalLinks.some((link) => link.getAttribute('href') === '/tasks/hub')).toBe(false);

    // Remount -> restores persisted 'vertical' mode
    cleanup();
    render(<FeatureCollection />);
    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });
  });

  it('activates the pinned scroll-linked stage on desktop (>=1024px) with fine pointer and motion enabled', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches:
          query === '(min-width: 1024px) and (min-height: 520px)' || query === '(pointer: fine)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    render(<FeatureCollection />);

    await waitFor(() => {
      expect(screen.getByTestId('horizontal-pinned-outer')).toBeInTheDocument();
    });
    expect(screen.getByTestId('horizontal-pinned-track')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(12);
  });

  it('promotes per-feature --card-accent CSS tokens and calm non-blurred ambient backdrop across all 12 cards', () => {
    const { container } = render(<FeatureCollection />);

    const cards = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('#features a[data-feature-id]'),
    );
    expect(cards).toHaveLength(12);

    cards.forEach((card, index) => {
      const entry = collectionFeatures[index];
      expect(entry).toBeDefined();
      expect(card).toHaveAttribute('data-feature-id', entry!.id);
      const accent = card.style.getPropertyValue('--card-accent');
      expect(accent).toBeTruthy();
      expect(accent).toMatch(/^var\(--|^color-mix\(/);
      expect(accent).not.toMatch(/#|rgb\(|rgba\(|hsl\(/i);
      expect(card.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });

    expect(cards[0]!.style.getPropertyValue('--card-accent')).toBe('var(--cosmos-lavender)');
    expect(cards[4]!.style.getPropertyValue('--card-accent')).toBe('var(--cosmos-star-pale)');
    expect(cards[7]!.style.getPropertyValue('--card-accent')).toBe('var(--status-notif-completed)');
    expect(cards[9]!.style.getPropertyValue('--card-accent')).toBe('var(--journey-flare-gold)');

    const section = container.querySelector('#features');
    expect(section?.innerHTML).not.toContain('blur-[90px]');
    expect(section?.innerHTML).not.toContain('blur-[100px]');
    expect(section?.innerHTML).not.toContain('w-[60vw]');
    expect(section?.innerHTML).not.toContain('w-[55vw]');
  });

  it('renders one morphing layout toggle that flips its label, icon, and accessible name', async () => {
    render(<FeatureCollection />);

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Gallery view, switch to grid view' });
    expect(toggle).toHaveAttribute('data-mode', 'horizontal');
    expect(toggle.querySelector('span[data-active="true"]')).toHaveTextContent('Gallery');
    expect(toggle.querySelector('svg[data-active="true"]')).toHaveClass(
      'lucide-gallery-horizontal',
    );

    fireEvent.click(toggle);

    const gridToggle = await screen.findByRole('button', {
      name: 'Grid view, switch to gallery view',
    });
    expect(gridToggle).toHaveAttribute('data-mode', 'vertical');
    expect(gridToggle.querySelector('span[data-active="true"]')).toHaveTextContent('Grid');
    expect(gridToggle.querySelector('svg[data-active="true"]')).toHaveClass('lucide-layout-grid');
  });

  it('pairs each static zodiac thumbnail with a hidden pre-glowed halo copy behind the artwork', () => {
    const { container } = render(<FeatureCollection />);

    const thumbs = container.querySelectorAll('[data-zodiac-thumb="static"]');
    expect(thumbs.length).toBeGreaterThan(0);
    thumbs.forEach((thumb) => {
      const copies = thumb.querySelectorAll('[data-zodiac-sign]');
      expect(copies).toHaveLength(2);
      expect(copies[0]?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(copies[0]?.getAttribute('data-zodiac-sign')).toBe(
        copies[1]?.getAttribute('data-zodiac-sign'),
      );
    });
  });

  it('computes 11-step (features.length - 1) pinned distance and smoothly interpolates translate3d without per-frame layout reads', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1440,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
      writable: true,
    });

    stubMatchMedia(
      (query) =>
        query === '(min-width: 1024px) and (min-height: 520px)' || query === '(pointer: fine)',
    );

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

    render(<FeatureCollection />);

    const outer = await waitFor(() => screen.getByTestId('horizontal-pinned-outer'));
    const track = screen.getByTestId('horizontal-pinned-track');

    // 1440x900 with 12 cards (588px), 11 gaps (24px); the track starts and ends on the header content gutter (120px each side) => travel = 6120, outerHeight = 7020
    expect(outer.style.height).toBe('7020px');
    // jsdom has no layout, so the measured header gutter is 0; the first pair still spans the
    // header content width, so start + end insets always total stage width minus the pair.
    expect(parseFloat(track.style.paddingLeft) + parseFloat(track.style.paddingRight)).toBe(240);
    expect(track.style.gap).toBe('24px');
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');

    const outerRectSpy = vi.spyOn(outer, 'getBoundingClientRect');
    Object.defineProperty(window, 'scrollY', {
      value: 3060,
      configurable: true,
      writable: true,
    });

    fireEvent.scroll(window);
    expect(rafQueue.length).toBe(1);
    expect(outerRectSpy).not.toHaveBeenCalled();

    const firstFrame = rafQueue.shift()!;
    firstFrame.cb(16.67);
    expect(outerRectSpy).not.toHaveBeenCalled();
    expect(track.style.transform).not.toBe('translate3d(0px, 0, 0)');
    expect(track.style.transform).not.toBe('translate3d(-3060px, 0, 0)');

    let time = 33.34;
    let safety = 0;
    while (rafQueue.length > 0 && safety < 120) {
      const nextFrame = rafQueue.shift()!;
      nextFrame.cb(time);
      time += 16.67;
      safety += 1;
    }

    expect(outerRectSpy).not.toHaveBeenCalled();
    expect(track.style.transform).toBe('translate3d(-3060px, 0, 0)');
    expect(rafQueue).toHaveLength(0);

    // Keyboard :focus-visible sync scrolls horizontally obscured card into view cleanly
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const lastCard = screen.getAllByRole('link')[11]!;
    const origMatches = lastCard.matches.bind(lastCard);
    vi.spyOn(lastCard, 'matches').mockImplementation((selector) =>
      selector === ':focus-visible' ? true : origMatches(selector),
    );
    fireEvent.focus(lastCard);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: expect.any(Number), behavior: 'instant' });
  });

  it('falls back to native snap gallery without pinning or rAF loops under reduced motion or touch pointer', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1440,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
      writable: true,
    });

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    // Reduced motion enabled even on desktop with fine pointer
    stubMatchMedia(
      (query) =>
        query === '(min-width: 1024px) and (min-height: 520px)' ||
        query === '(pointer: fine)' ||
        query === '(prefers-reduced-motion: reduce)',
    );

    render(<FeatureCollection />);
    await waitFor(() => {
      expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('horizontal-pinned-outer')).not.toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();

    cleanup();
    rafSpy.mockClear();

    // Coarse/touch pointer on desktop viewport dimensions
    stubMatchMedia((query) => query === '(min-width: 1024px) and (min-height: 520px)');
    render(<FeatureCollection />);
    await waitFor(() => {
      expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('horizontal-pinned-outer')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Feature cards horizontal gallery' })).toHaveClass(
      'snap-x',
    );
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('renders Explore my space only as a collection heading in the motion preview', () => {
    const html = renderToStaticMarkup(<HomeJourney preview />);
    const page = new DOMParser().parseFromString(html, 'text/html');
    expect(page.querySelectorAll('h2')).toHaveLength(1);
    expect(
      page.querySelector('section[aria-labelledby="preview-features-heading"] h2')?.textContent,
    ).toBe('Explore my space');
    expect(page.querySelector('button')).toBeNull();
    expect(page.querySelector('canvas')).not.toBeNull();
  });

  it('gates horizontal travel until reveal completion, preserves card nodes, uses scrollStartOffset, glides cleanly on upward reverse, and resets immediately on far jump', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1440,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 3150,
      configurable: true,
      writable: true,
    });

    stubMatchMedia(
      (query) =>
        query === '(min-width: 1024px) and (min-height: 520px)' || query === '(pointer: fine)',
    );

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

    const { rerender } = render(
      <FeatureCollection revealState="revealing" revealComplete={false} scrollStartOffset={3600} />,
    );

    const outer = await waitFor(() => screen.getByTestId('horizontal-pinned-outer'));
    const track = screen.getByTestId('horizontal-pinned-track');
    const firstCardBefore = screen.getAllByRole('link')[0];

    expect(outer.style.height).toBe('7020px');
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');

    // Scrolling during partial reveal does not move the horizontal track or queue rAF loops
    Object.defineProperty(window, 'scrollY', {
      value: 3450,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(window);
    expect(rafQueue).toHaveLength(0);
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');

    // Complete reveal at scrollY = 3600 -> zero boundary jump, same card DOM node, and zero layout recalculation
    Object.defineProperty(window, 'scrollY', {
      value: 3600,
      configurable: true,
      writable: true,
    });
    const computedStyleSpy = vi.spyOn(window, 'getComputedStyle');
    const outerRectSpy = vi.spyOn(outer, 'getBoundingClientRect');
    rerender(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );

    expect(computedStyleSpy).not.toHaveBeenCalled();
    expect(outerRectSpy).not.toHaveBeenCalled();
    expect(screen.getAllByRole('link')[0]).toBe(firstCardBefore);
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');

    // Scroll halfway through 6120px horizontal travel (3600 + 3060 = 6660)
    Object.defineProperty(window, 'scrollY', {
      value: 6660,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(window);
    let time = 16.67;
    let safety = 0;
    while (rafQueue.length > 0 && safety < 120) {
      const frame = rafQueue.shift()!;
      frame.cb(time);
      time += 16.67;
      safety += 1;
    }
    expect(track.style.transform).toBe('translate3d(-3060px, 0, 0)');

    // Keyboard Tab focus sync anchors against scrollStartOffset (3600 + next)
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const lastCard = screen.getAllByRole('link')[11]!;
    const origMatches = lastCard.matches.bind(lastCard);
    vi.spyOn(lastCard, 'matches').mockImplementation((selector) =>
      selector === ':focus-visible' ? true : origMatches(selector),
    );
    fireEvent.focus(lastCard);
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'instant',
    });
    const focusTargetTop = (scrollToSpy.mock.calls[0]?.[0] as ScrollToOptions).top ?? 0;
    expect(focusTargetTop).toBeGreaterThan(3600);

    // Rapid upward reverse near scrollStartOffset (3400) glides smoothly toward 0 without forcing layout recalculation
    const transformBeforeReverse = track.style.transform;
    computedStyleSpy.mockClear();
    outerRectSpy.mockClear();
    Object.defineProperty(window, 'scrollY', {
      value: 3400,
      configurable: true,
      writable: true,
    });
    rerender(
      <FeatureCollection revealState="revealing" revealComplete={false} scrollStartOffset={3600} />,
    );
    expect(computedStyleSpy).not.toHaveBeenCalled();
    expect(outerRectSpy).not.toHaveBeenCalled();
    expect(rafQueue.length).toBe(1);

    rafQueue.shift()!.cb(200);
    expect(track.style.transform).not.toBe(transformBeforeReverse);
    expect(track.style.transform).not.toBe('translate3d(0px, 0, 0)');
    expect(rafQueue).toHaveLength(1);

    let reverseTime = 216.67;
    let reverseSafety = 0;
    while (rafQueue.length > 0 && reverseSafety < 120) {
      const frame = rafQueue.shift()!;
      frame.cb(reverseTime);
      reverseTime += 16.67;
      reverseSafety += 1;
    }
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');
    expect(rafQueue).toHaveLength(0);

    // Far upward jump below neighborhood (< 2540) resets horizontal travel immediately
    rerender(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );
    Object.defineProperty(window, 'scrollY', {
      value: 6660,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(window);
    let forwardTime = 3000;
    let forwardSafety = 0;
    while (rafQueue.length > 0 && forwardSafety < 120) {
      const frame = rafQueue.shift()!;
      frame.cb(forwardTime);
      forwardTime += 16.67;
      forwardSafety += 1;
    }
    expect(track.style.transform).toBe('translate3d(-3060px, 0, 0)');

    computedStyleSpy.mockClear();
    outerRectSpy.mockClear();
    Object.defineProperty(window, 'scrollY', {
      value: 2000,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(window);
    rerender(
      <FeatureCollection revealState="hidden" revealComplete={false} scrollStartOffset={3600} />,
    );
    expect(computedStyleSpy).not.toHaveBeenCalled();
    expect(outerRectSpy).not.toHaveBeenCalled();
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');
    expect(rafQueue).toHaveLength(0);
  });

  it('anchors layout switches to scrollStartOffset and defers VerticalGrid card reveal until revealComplete', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    const { container } = render(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /switch to grid view/i }));
    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });
    while (rafQueue.length > 0) {
      rafQueue.shift()!(16.67);
    }

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 3600, behavior: 'auto' });
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    expect(container.querySelector('#features')).toHaveClass('scroll-mt-0');

    // Fresh VerticalGrid mount while revealComplete={false} defers whileInView until revealed
    cleanup();
    intersectionObserveSpy.mockClear();
    const { rerender: rerenderVertical, container: verticalContainer } = render(
      <FeatureCollection revealState="revealing" revealComplete={false} scrollStartOffset={3600} />,
    );
    const verticalGrid = screen.getByTestId('vertical-feature-grid');
    const cardWrappers = Array.from(verticalGrid.querySelectorAll<HTMLElement>('.grid > div'));
    expect(cardWrappers).toHaveLength(12);
    expect(cardWrappers[0]!.style.opacity).toBe('0');
    expect(intersectionObserveSpy).not.toHaveBeenCalled();

    // Once reveal completes, VerticalGrid attaches IntersectionObserver for whileInView entrance
    rerenderVertical(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );
    expect(intersectionObserveSpy).toHaveBeenCalledTimes(12);
    expect(verticalContainer.querySelector('#features')).toHaveClass('scroll-mt-0');
  });

  it('removes HomeFooter from HomeJourney and moves Earth credits into an accessible intro disclosure', () => {
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)');
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
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    const { container } = renderWithHomeProviders(<HomeJourney />);
    const introSection = container.querySelector<HTMLElement>('section[aria-label="Introduction"]');
    const stage = introSection?.querySelector<HTMLElement>('div[data-home-hydrated="true"]');
    expect(introSection).not.toBeNull();
    expect(stage).not.toBeNull();

    Object.defineProperty(introSection!, 'offsetHeight', { configurable: true, value: 3600 });
    Object.defineProperty(stage!, 'clientWidth', { configurable: true, value: 1440 });
    Object.defineProperty(stage!, 'clientHeight', { configurable: true, value: 900 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(container.querySelector('footer')).toBeNull();
    expect(screen.queryByText(/Built on Hiep Trong Space/i)).not.toBeInTheDocument();

    expect(container.querySelector('[data-home-intro]')?.querySelector('button')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Earth credits' });
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = panelId ? document.getElementById(panelId) : null;
    expect(panel).not.toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toBeDisabled();
    expect(panel).toHaveAttribute('hidden');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('hidden');
    expect(screen.getByRole('link', { name: 'Solar System Scope (INOVE)' })).toHaveAttribute(
      'href',
      'https://www.solarsystemscope.com/textures/',
    );
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    );
    expect(panel).toHaveTextContent(/based on NASA imagery/i);
    expect(panel).toHaveTextContent(/Globe lighting and rendering adapted for Hiep Trong Space\./i);

    const solarLink = screen.getByRole('link', { name: 'Solar System Scope (INOVE)' });
    solarLink.focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3600 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      while (rafQueue.length > 0) {
        rafQueue.shift()!(16.67);
      }
    });

    const creditsWrapper = container.querySelector<HTMLElement>('[data-earth-credits]');
    expect(creditsWrapper).toHaveAttribute('data-earth-credits-locked', 'true');
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Hiep Trong Space home' }));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      while (rafQueue.length > 0) {
        rafQueue.shift()!(16.67);
      }
    });

    expect(creditsWrapper).toHaveAttribute('data-earth-credits-locked', 'false');
    expect(trigger).not.toBeDisabled();

    cleanup();
    const { container: previewContainer } = renderWithHomeProviders(<HomeJourney preview />);
    expect(previewContainer.querySelector('[data-earth-credits]')).toBeNull();
    expect(previewContainer.querySelector('footer')).toBeNull();
  });

  it('guards backward scroll in Horizontal mode while allowing explicit home return and unguarded Vertical scroll', () => {
    vi.useFakeTimers();
    stubMatchMedia(
      (query) =>
        query === '(min-width: 1024px) and (min-height: 520px)' || query === '(pointer: fine)',
    );
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    let currentScrollY = 4000;
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => currentScrollY,
    });
    const scrollToSpy = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation((optionsOrX: ScrollToOptions | number, maybeY?: number) => {
        if (typeof optionsOrX === 'object' && typeof optionsOrX.top === 'number') {
          currentScrollY = optionsOrX.top;
        } else if (typeof maybeY === 'number') {
          currentScrollY = maybeY;
        }
      });

    const createTouchEvent = (
      type: 'touchstart' | 'touchmove' | 'touchend',
      points: Array<{ identifier: number; clientX: number; clientY: number }>,
    ) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', { value: points });
      return event;
    };

    const resetCallbackSpy = vi.fn<() => void>();
    const capturedReset: { current: (() => void) | null } = { current: null };
    render(
      <FeatureCollection
        revealState="revealed"
        revealComplete={true}
        scrollStartOffset={3600}
        onRegisterReturnGuardReset={(reset) => {
          capturedReset.current = reset;
          if (reset) {
            resetCallbackSpy();
          }
        }}
      />,
    );
    expect(capturedReset.current).not.toBeNull();
    expect(resetCallbackSpy).toHaveBeenCalledTimes(1);

    // 1. Crossing gesture from inside the collection (4000 -> boundary) clamps and consumes remainder
    const crossingWheel = new WheelEvent('wheel', {
      deltaY: -600,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(crossingWheel);
    expect(crossingWheel.defaultPrevented).toBe(true);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 3600, behavior: 'instant' });
    expect(currentScrollY).toBe(3600);

    // Tail inertia events inside the 220ms gesture window stay clamped and do not accumulate resistance
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const tailWheel = new WheelEvent('wheel', {
      deltaY: -400,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(tailWheel);
    expect(tailWheel.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3600);

    // After 220ms wheel idle, guard arms at boundary
    act(() => {
      vi.advanceTimersByTime(220);
    });

    // Sub-threshold wheel (60px < 120px) stays clamped; waiting 220ms resets partial resistance
    const subThresholdWheel = new WheelEvent('wheel', {
      deltaY: -60,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(subThresholdWheel);
    expect(subThresholdWheel.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3600);

    act(() => {
      vi.advanceTimersByTime(220);
    });

    // Overlay popups are excluded from return-guard interception
    const overlayPopup = document.createElement('div');
    overlayPopup.setAttribute('data-overlay-popup', 'true');
    document.body.appendChild(overlayPopup);
    const popupWheel = new WheelEvent('wheel', {
      deltaY: -300,
      bubbles: true,
      cancelable: true,
    });
    overlayPopup.dispatchEvent(popupWheel);
    expect(popupWheel.defaultPrevented).toBe(false);
    overlayPopup.remove();

    // Line-mode wheel delta (deltaMode === 1 -> * 16px): 5 lines = 80px (clamped), +3 lines = 128px (>= 120px releases)
    const firstLineWheel = new WheelEvent('wheel', {
      deltaY: -5,
      deltaMode: 1,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(firstLineWheel);
    expect(firstLineWheel.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3600);

    const secondLineWheel = new WheelEvent('wheel', {
      deltaY: -3,
      deltaMode: 1,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(secondLineWheel);
    expect(secondLineWheel.defaultPrevented).toBe(true);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 3592, behavior: 'instant' });
    expect(currentScrollY).toBe(3592);

    // Return into collection (> 3600), verify [role="dialog"] exclusion, page-mode deltaMode === 2, and keyboard repeat guards
    currentScrollY = 4000;
    window.dispatchEvent(new Event('scroll'));

    const pageCrossWheel = new WheelEvent('wheel', {
      deltaY: -500,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(pageCrossWheel);
    expect(currentScrollY).toBe(3600);
    act(() => {
      vi.advanceTimersByTime(220);
    });

    const dialogEl = document.createElement('div');
    dialogEl.setAttribute('role', 'dialog');
    document.body.appendChild(dialogEl);
    const dialogWheel = new WheelEvent('wheel', {
      deltaY: -400,
      bubbles: true,
      cancelable: true,
    });
    dialogEl.dispatchEvent(dialogWheel);
    expect(dialogWheel.defaultPrevented).toBe(false);
    dialogEl.remove();

    const pageModeWheel = new WheelEvent('wheel', {
      deltaY: -1,
      deltaMode: 2,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(pageModeWheel);
    expect(pageModeWheel.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3592);

    // Re-enter collection and test keyboard repeat + interactive input exclusion
    currentScrollY = 4000;
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -500, bubbles: true, cancelable: true }),
    );
    expect(currentScrollY).toBe(3600);
    act(() => {
      vi.advanceTimersByTime(220);
    });

    const inputEl = document.createElement('input');
    document.body.appendChild(inputEl);
    inputEl.focus();
    const inputArrow = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    });
    inputEl.dispatchEvent(inputArrow);
    expect(inputArrow.defaultPrevented).toBe(false);
    inputEl.remove();

    const repeatedArrow = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      repeat: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(repeatedArrow);
    expect(repeatedArrow.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3600);

    const freshArrow = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      repeat: false,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(freshArrow);
    expect(freshArrow.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3592);

    // NativeSnapHorizontalGallery touch gesture guard + explicit reset bypass
    cleanup();
    stubMatchMedia(() => false);
    currentScrollY = 4000;
    render(
      <FeatureCollection
        revealState="revealed"
        revealComplete={true}
        scrollStartOffset={3600}
        onRegisterReturnGuardReset={(reset) => {
          capturedReset.current = reset;
        }}
      />,
    );
    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();

    // Crossing touch swipe stays clamped until finger lifts
    window.dispatchEvent(
      createTouchEvent('touchstart', [{ identifier: 1, clientX: 120, clientY: 120 }]),
    );
    currentScrollY = 3600;
    const crossingSwipe = createTouchEvent('touchmove', [
      { identifier: 1, clientX: 120, clientY: 170 },
    ]);
    window.dispatchEvent(crossingSwipe);
    expect(crossingSwipe.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3600);
    window.dispatchEvent(createTouchEvent('touchend', []));

    // Horizontal touch gesture is ignored while armed
    window.dispatchEvent(
      createTouchEvent('touchstart', [{ identifier: 2, clientX: 200, clientY: 200 }]),
    );
    const horizontalSwipe = createTouchEvent('touchmove', [
      { identifier: 2, clientX: 140, clientY: 208 },
    ]);
    window.dispatchEvent(horizontalSwipe);
    expect(horizontalSwipe.defaultPrevented).toBe(false);
    window.dispatchEvent(createTouchEvent('touchend', []));

    // Sub-threshold vertical touch swipe (< 24px) stays clamped
    window.dispatchEvent(
      createTouchEvent('touchstart', [{ identifier: 3, clientX: 120, clientY: 200 }]),
    );
    const shortSwipe = createTouchEvent('touchmove', [
      { identifier: 3, clientX: 120, clientY: 218 },
    ]);
    window.dispatchEvent(shortSwipe);
    expect(shortSwipe.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3600);
    window.dispatchEvent(createTouchEvent('touchend', []));

    // Fresh deliberate upward touch swipe (>= 24px) releases back toward Homepage
    window.dispatchEvent(
      createTouchEvent('touchstart', [{ identifier: 4, clientX: 120, clientY: 200 }]),
    );
    const releaseSwipe = createTouchEvent('touchmove', [
      { identifier: 4, clientX: 120, clientY: 228 },
    ]);
    window.dispatchEvent(releaseSwipe);
    expect(releaseSwipe.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(3592);
    window.dispatchEvent(createTouchEvent('touchend', []));

    // Registered reset helper disarms guard synchronously (used by [data-collection-home])
    currentScrollY = 3600;
    window.dispatchEvent(new Event('scroll'));
    capturedReset.current?.();
    const unblockedAfterResetWheel = new WheelEvent('wheel', {
      deltaY: -150,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(unblockedAfterResetWheel);
    expect(unblockedAfterResetWheel.defaultPrevented).toBe(false);

    // Switching to Vertical disables backward scroll clamping completely
    fireEvent.click(screen.getByRole('button', { name: /switch to grid view/i }));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();

    currentScrollY = 3600;
    const verticalWheel = new WheelEvent('wheel', {
      deltaY: -200,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(verticalWheel);
    expect(verticalWheel.defaultPrevented).toBe(false);
  });

  it('smoothly transitions Horizontal/Vertical layouts with focus restoration, handles rapid toggles, and skips opacity delay under reduced motion', () => {
    vi.useFakeTimers();
    stubMatchMedia(
      (query) =>
        query === '(min-width: 1024px) and (min-height: 520px)' || query === '(pointer: fine)',
    );
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    const { container } = render(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );
    const transitionStage = container.querySelector<HTMLElement>('[data-layout-transition]');
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'idle');
    expect(screen.getByTestId('horizontal-pinned-outer')).toBeInTheDocument();

    // Rapid consecutive toggle: Vertical -> Horizontal before 150ms swap lands
    fireEvent.click(screen.getByRole('button', { name: /switch to grid view/i }));
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'fading-out');
    expect(screen.getByTestId('horizontal-pinned-outer')).toBeInTheDocument();
    expect(screen.queryByTestId('vertical-feature-grid')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60);
    });
    fireEvent.click(screen.getByRole('button', { name: /switch to gallery view/i }));
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'fading-in');
    expect(screen.getByTestId('horizontal-pinned-outer')).toBeInTheDocument();
    expect(screen.queryByTestId('vertical-feature-grid')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^gallery view/i }));

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'idle');
    expect(screen.getByTestId('horizontal-pinned-outer')).toBeInTheDocument();
    expect(screen.queryByTestId('vertical-feature-grid')).not.toBeInTheDocument();

    // Complete Horizontal -> Vertical transition
    fireEvent.click(screen.getByRole('button', { name: /switch to grid view/i }));
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'fading-out');

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'fading-in');
    expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('horizontal-pinned-outer')).not.toBeInTheDocument();

    const controlsWrapper = container.querySelector<HTMLElement>('[data-collection-controls]');
    expect(controlsWrapper).toHaveAttribute('data-layout-mode', 'vertical');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^grid view/i }));

    act(() => {
      while (rafQueue.length > 0) {
        rafQueue.shift()!(16.67);
      }
    });
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 3600, behavior: 'auto' });

    act(() => {
      vi.advanceTimersByTime(170);
    });
    expect(transitionStage).toHaveAttribute('data-layout-transition', 'idle');
    expect(transitionStage?.style.minHeight).toBe('');

    // Reduced motion swaps immediately without opacity lag
    cleanup();
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)');
    const { container: reducedContainer } = render(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );
    const reducedStage = reducedContainer.querySelector<HTMLElement>('[data-layout-transition]');
    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /switch to grid view/i }));
    expect(reducedStage).toHaveAttribute('data-layout-transition', 'idle');
    expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('horizontal-native-gallery')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^grid view/i }));
  });
});
