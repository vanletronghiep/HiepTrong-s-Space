// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRouteZodiacSign } from '@/features/transitions/route-zodiac';
import {
  normalizePathname,
  parseInternalHref,
  shouldTriggerRouteLoader,
} from '@/features/transitions/transition-rules';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import {
  FAILSAFE_REVEAL_MS,
  LOADER_DISMISS_MS,
  PageReady,
  TransitionProvider,
  useNavigationGuard,
} from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

let mockedPathname = '/';
const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => mockedPathname,
}));

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query === '(prefers-reduced-motion: reduce)',
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

function Harness({ readyFor }: { readyFor: Record<string, boolean> }) {
  return (
    <ToastProvider>
      <TransitionProvider>
        <main>
          <h1>{mockedPathname === '/' ? 'Home' : `Page ${mockedPathname}`}</h1>
          <TransitionLink href="/tasks/daily">Go daily</TransitionLink>
          <TransitionLink href="/events">Go events</TransitionLink>
          <TransitionLink href="/notifications">Go notifications</TransitionLink>
          {readyFor[mockedPathname] !== undefined ? (
            <PageReady ready={readyFor[mockedPathname]} />
          ) : null}
        </main>
      </TransitionProvider>
    </ToastProvider>
  );
}

describe('Destination zodiac route loader (v3.1 §3.2)', () => {
  beforeEach(() => {
    mockedPathname = '/';
    pushMock.mockReset();
    replaceMock.mockReset();
    vi.useFakeTimers();
    stubMatchMedia(false);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.style.overflow = '';
    document.documentElement.removeAttribute('aria-busy');
  });

  it('evaluates eligibility across pathname, query, hash, external, and double-click cases', () => {
    expect(normalizePathname('/tasks/hub/')).toBe('/tasks/hub');
    expect(parseInternalHref('https://google.com')).toBeNull();
    expect(parseInternalHref('#features')).toBeNull();
    expect(parseInternalHref('//evil.example')).toBeNull();
    const base = { currentPathname: '/', isTransitioning: false };
    expect(shouldTriggerRouteLoader({ ...base, href: '/tasks/daily' })).toBe(true);
    expect(
      shouldTriggerRouteLoader({
        href: '/tasks/hub?task=1',
        currentPathname: '/tasks/daily',
        isTransitioning: false,
      }),
    ).toBe(true);
    expect(
      shouldTriggerRouteLoader({
        href: '/tasks/hub?task=1',
        currentPathname: '/tasks/hub',
        isTransitioning: false,
      }),
    ).toBe(false);
    expect(shouldTriggerRouteLoader({ ...base, href: '/#features' })).toBe(false);
    expect(shouldTriggerRouteLoader({ ...base, href: '/events', isTransitioning: true })).toBe(
      false,
    );
  });

  it('maps destinations to their zodiac: Daily and Hub use Aries, Events Taurus, Home none', () => {
    expect(getRouteZodiacSign('/tasks/daily')).toBe('aries');
    expect(getRouteZodiacSign('/tasks/hub')).toBe('aries');
    expect(getRouteZodiacSign('/events')).toBe('taurus');
    expect(getRouteZodiacSign('/blogs')).toBe('cancer');
    expect(getRouteZodiacSign('/')).toBeNull();
    expect(getRouteZodiacSign('/notifications')).toBeNull();
  });

  it('navigates immediately and dismisses as soon as an already-ready destination arrives', () => {
    const { rerender } = render(<Harness readyFor={{ '/tasks/daily': true }} />);

    fireEvent.click(screen.getByRole('link', { name: 'Go daily' }));
    expect(pushMock).toHaveBeenCalledWith('/tasks/daily');
    const loader = screen.getByTestId('route-loader');
    expect(loader).toHaveAttribute('data-mode', 'zodiac');
    expect(screen.getByTestId('route-loader-zodiac')).toHaveAttribute('data-sign', 'aries');
    expect(screen.getByRole('status')).toHaveTextContent('Loading Task Management…');

    // Arrival with a ready page ends the loader with no minimum display time.
    mockedPathname = '/tasks/daily';
    rerender(<Harness readyFor={{ '/tasks/daily': true }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.documentElement.hasAttribute('aria-busy')).toBe(false);

    act(() => {
      vi.advanceTimersByTime(LOADER_DISMISS_MS);
    });
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
  });

  it('holds while the destination is still loading, ignores repeat clicks, then releases on ready', () => {
    const { rerender } = render(<Harness readyFor={{ '/events': false }} />);

    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    fireEvent.click(screen.getByRole('link', { name: 'Go daily' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe('hidden');

    mockedPathname = '/events';
    rerender(<Harness readyFor={{ '/events': false }} />);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'loading');

    rerender(<Harness readyFor={{ '/events': true }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
  });

  it('never lets a stale signal from another route complete the pending navigation', () => {
    const { rerender } = render(<Harness readyFor={{ '/': true, '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    // The origin page re-signals its own pathname while the destination is pending.
    rerender(<Harness readyFor={{ '/': true, '/events': false }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'loading');
  });

  it('reveals the destination through the failsafe instead of trapping the user', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<Harness readyFor={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    mockedPathname = '/events';
    rerender(<Harness readyFor={{ '/events': false }} />);

    act(() => {
      vi.advanceTimersByTime(FAILSAFE_REVEAL_MS);
    });
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
    expect(document.documentElement.style.overflow).toBe('');
    expect(warn).toHaveBeenCalled();
  });

  it('shows only centred "Loading <title>" text (no spinner, no artwork) for routes without a zodiac', () => {
    render(<Harness readyFor={{}} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go notifications' }));
    const loader = screen.getByTestId('route-loader');
    expect(loader).toHaveAttribute('data-mode', 'text');
    expect(loader).toHaveAttribute('data-has-art', 'false');
    expect(screen.queryByTestId('route-loader-zodiac')).not.toBeInTheDocument();
    expect(screen.queryByTestId('route-loader-neutral')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading Notifications…');
    expect(loader).toHaveTextContent('Loading Notifications');
  });

  it('animates three loading dots and places the label below the artwork when a zodiac exists', () => {
    render(<Harness readyFor={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    const loader = screen.getByTestId('route-loader');
    expect(loader).toHaveAttribute('data-has-art', 'true');
    const dots = screen.getByTestId('route-loader-dots');
    expect(dots.querySelectorAll('span')).toHaveLength(3);
    const art = screen.getByTestId('route-loader-zodiac');
    expect(art.compareDocumentPosition(dots) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a static symbol and loading text under reduced motion, with no forced hold', () => {
    stubMatchMedia(true);
    const { rerender } = render(<Harness readyFor={{ '/events': true }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    // Reduced motion keeps the artwork, fully drawn and static, with the label beneath.
    expect(screen.getByTestId('route-loader-zodiac')).toHaveAttribute('data-path', 'fast');
    expect(screen.getByTestId('route-loader-dots')).toBeInTheDocument();

    mockedPathname = '/events';
    rerender(<Harness readyFor={{ '/events': true }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
  });

  it('navigates directly without a loader for same-path query updates', () => {
    mockedPathname = '/tasks/hub';
    render(
      <ToastProvider>
        <TransitionProvider>
          <PageReady />
          <TransitionLink href="/tasks/hub?task=abc">Highlight task</TransitionLink>
        </TransitionProvider>
      </ToastProvider>,
    );
    // The hard-load overlay of the initial page dismisses as soon as the page is ready.
    act(() => {
      vi.advanceTimersByTime(LOADER_DISMISS_MS);
    });
    fireEvent.click(screen.getByRole('link', { name: 'Highlight task' }));
    expect(pushMock).toHaveBeenCalledWith('/tasks/hub?task=abc');
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
  });

  it('keeps dirty-form guards: a cancelled guard starts no navigation or loader', () => {
    function Guarded() {
      useNavigationGuard(true, () => undefined);
      return null;
    }
    render(
      <ToastProvider>
        <TransitionProvider>
          <Guarded />
          <TransitionLink href="/events">Go events</TransitionLink>
        </TransitionProvider>
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
  });

  it('cleans up timers and the scroll lock on unmount', () => {
    const { unmount } = render(<Harness readyFor={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    expect(document.documentElement.style.overflow).toBe('hidden');
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
  });
});
