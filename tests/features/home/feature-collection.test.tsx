// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeatureCollectionLayoutPreference } from '@/client/preferences';
import { FeatureCollection } from '@/features/home/feature-collection/FeatureCollection';
import { COLLECTION_SUBTITLE_COPY } from '@/features/home/home-journey';
import { HomeJourney } from '@/features/home/HomeJourney';
import { FEATURE_REGISTRY } from '@/features/registry';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

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

  it('renders all 13 feature cards in registry order in Horizontal fallback mode and switches to Vertical mode with persistence', async () => {
    render(<FeatureCollection />);

    const heading = screen.getByRole('heading', { name: 'My collection' });
    expect(heading).toBeInTheDocument();
    expect(heading.querySelector('span')).toHaveTextContent('collection');
    expect(screen.getByText(COLLECTION_SUBTITLE_COPY)).toBeInTheDocument();
    expect(screen.getByTestId('horizontal-native-gallery')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(13);
    FEATURE_REGISTRY.forEach((entry, index) => {
      expect(links[index]).toHaveAttribute('href', entry.href);
      expect(links[index]).toHaveTextContent(entry.title);
      expect(links[index]).toHaveTextContent(entry.label);
    });

    // Switch to Vertical mode
    const verticalRadio = screen.getByRole('radio', { name: 'Vertical' });
    fireEvent.click(verticalRadio);

    await waitFor(() => {
      expect(screen.getByTestId('vertical-feature-grid')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('horizontal-native-gallery')).not.toBeInTheDocument();
    expect(getFeatureCollectionLayoutPreference()).toBe('vertical');

    const verticalLinks = screen.getAllByRole('link');
    expect(verticalLinks).toHaveLength(13);

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
    expect(screen.getAllByRole('link')).toHaveLength(13);
  });

  it('promotes per-feature --card-accent CSS tokens and calm non-blurred ambient backdrop across all 13 cards', () => {
    const { container } = render(<FeatureCollection />);

    const cards = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('#features a[data-feature-id]'),
    );
    expect(cards).toHaveLength(13);

    cards.forEach((card, index) => {
      const entry = FEATURE_REGISTRY[index];
      expect(entry).toBeDefined();
      expect(card).toHaveAttribute('data-feature-id', entry!.id);
      const accent = card.style.getPropertyValue('--card-accent');
      expect(accent).toBeTruthy();
      expect(accent).toMatch(/^var\(--|^color-mix\(/);
      expect(accent).not.toMatch(/#|rgb\(|rgba\(|hsl\(/i);
      expect(card.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });

    expect(cards[0]!.style.getPropertyValue('--card-accent')).toBe('var(--cosmos-lavender)');
    expect(cards[1]!.style.getPropertyValue('--card-accent')).toBe('var(--cosmos-star-blue)');
    expect(cards[8]!.style.getPropertyValue('--card-accent')).toBe('var(--status-notif-completed)');
    expect(cards[10]!.style.getPropertyValue('--card-accent')).toBe('var(--journey-flare-gold)');

    const section = container.querySelector('#features');
    expect(section?.innerHTML).not.toContain('blur-[90px]');
    expect(section?.innerHTML).not.toContain('blur-[100px]');
    expect(section?.innerHTML).not.toContain('w-[60vw]');
    expect(section?.innerHTML).not.toContain('w-[55vw]');
  });

  it('computes 12-step (features.length - 1) pinned distance and smoothly interpolates translate3d without per-frame layout reads', async () => {
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

    // 1440x900 with 13 cards (588px), 12 gaps (24px), 120px side padding => travel = 6732, outerHeight = 7632
    expect(outer.style.height).toBe('7632px');
    expect(track.style.paddingLeft).toBe('120px');
    expect(track.style.paddingRight).toBe('120px');
    expect(track.style.gap).toBe('24px');
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)');

    const outerRectSpy = vi.spyOn(outer, 'getBoundingClientRect');
    Object.defineProperty(window, 'scrollY', {
      value: 3366,
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
    expect(track.style.transform).not.toBe('translate3d(-3366px, 0, 0)');

    let time = 33.34;
    let safety = 0;
    while (rafQueue.length > 0 && safety < 120) {
      const nextFrame = rafQueue.shift()!;
      nextFrame.cb(time);
      time += 16.67;
      safety += 1;
    }

    expect(outerRectSpy).not.toHaveBeenCalled();
    expect(track.style.transform).toBe('translate3d(-3366px, 0, 0)');
    expect(rafQueue).toHaveLength(0);

    // Keyboard :focus-visible sync scrolls horizontally obscured card into view cleanly
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const lastCard = screen.getAllByRole('link')[12]!;
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

    expect(outer.style.height).toBe('7632px');
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

    // Scroll halfway through 6732px horizontal travel (3600 + 3366 = 6966)
    Object.defineProperty(window, 'scrollY', {
      value: 6966,
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
    expect(track.style.transform).toBe('translate3d(-3366px, 0, 0)');

    // Keyboard Tab focus sync anchors against scrollStartOffset (3600 + next)
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const lastCard = screen.getAllByRole('link')[12]!;
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
      value: 6966,
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
    expect(track.style.transform).toBe('translate3d(-3366px, 0, 0)');

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

    fireEvent.click(screen.getByRole('radio', { name: 'Vertical' }));
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
    expect(cardWrappers).toHaveLength(13);
    expect(cardWrappers[0]!.style.opacity).toBe('0');
    expect(intersectionObserveSpy).not.toHaveBeenCalled();

    // Once reveal completes, VerticalGrid attaches IntersectionObserver for whileInView entrance
    rerenderVertical(
      <FeatureCollection revealState="revealed" revealComplete={true} scrollStartOffset={3600} />,
    );
    expect(intersectionObserveSpy).toHaveBeenCalledTimes(13);
    expect(verticalContainer.querySelector('#features')).toHaveClass('scroll-mt-0');
  });
});
