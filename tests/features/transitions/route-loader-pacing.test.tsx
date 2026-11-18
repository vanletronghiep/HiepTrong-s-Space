// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import {
  LOADER_DISMISS_MS,
  PageReady,
  TransitionProvider,
} from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

interface StubProps {
  sign: string;
  active?: boolean;
  presentation?: string;
  forwardSpeed?: number;
  onFrame?: (snapshot: { p: number }) => void;
}

const captured = vi.hoisted(() => ({ props: null as StubProps | null }));

vi.mock('@/features/zodiac/ZodiacIllumination', () => ({
  ZodiacIllumination: (props: StubProps) => {
    captured.props = props;
    return <div data-testid="zodiac-stub" data-presentation={props.presentation} />;
  },
}));

let mockedPathname = '/';
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => mockedPathname,
}));

const HISTORY_KEY = 'hts.routeLoadHistory';

function Harness({ ready }: { ready: Record<string, boolean> }) {
  return (
    <ToastProvider>
      <TransitionProvider>
        <main>
          <h1>Page</h1>
          <TransitionLink href="/events">Go events</TransitionLink>
          {ready[mockedPathname] !== undefined ? <PageReady ready={ready[mockedPathname]} /> : null}
        </main>
      </TransitionProvider>
    </ToastProvider>
  );
}

describe('Route loader pacing, history and hard loads (v3.2)', () => {
  beforeEach(() => {
    mockedPathname = '/';
    captured.props = null;
    pushMock.mockReset();
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
        clear: () => store.clear(),
      },
    });
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.documentElement.style.overflow = '';
    document.documentElement.removeAttribute('aria-busy');
  });

  it('draws a first (cold) visit over the default cold estimate', () => {
    render(<Harness ready={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));

    expect(screen.getByTestId('route-loader-zodiac')).toHaveAttribute('data-path', 'draw');
    expect(captured.props?.presentation).toBe('loader');
    expect(captured.props?.active).toBe(true);
    expect(captured.props?.forwardSpeed).toBeCloseTo(1000 / 1200, 5);
  });

  it('scales the drawing speed to a longer recorded estimate', () => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ '/events': { cold: 3000 } }));
    render(<Harness ready={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    expect(captured.props?.forwardSpeed).toBeCloseTo(1000 / 3000, 5);
  });

  it('shows only the fully drawn static artwork when the estimate is very short', () => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ '/events': { cold: 100 } }));
    render(<Harness ready={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));

    expect(screen.getByTestId('route-loader-zodiac')).toHaveAttribute('data-path', 'fast');
    expect(captured.props?.presentation).toBe('static');
    expect(captured.props?.active).toBe(false);
    expect(screen.getByTestId('route-loader')).toHaveTextContent('Loading Events');
  });

  it('upgrades a fast-path route that is still loading to a drawing', () => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ '/events': { cold: 100 } }));
    render(<Harness ready={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('route-loader-zodiac')).toHaveAttribute('data-path', 'draw');
    expect(captured.props?.active).toBe(true);
  });

  it('fast-forwards a mid-flight drawing when the page is ready early, then dismisses when drawn', () => {
    const { rerender } = render(<Harness ready={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    act(() => {
      captured.props?.onFrame?.({ p: 0.4 });
    });

    mockedPathname = '/events';
    rerender(<Harness ready={{ '/events': true }} />);

    // Still loading while the remainder is finished within ~300ms.
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'loading');
    expect(captured.props?.forwardSpeed).toBeCloseTo(1000 / 300, 5);

    act(() => {
      captured.props?.onFrame?.({ p: 1 });
    });
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
    act(() => {
      vi.advanceTimersByTime(LOADER_DISMISS_MS);
    });
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
  });

  it('never waits for a drawing that has not started when the page is ready', () => {
    const { rerender } = render(<Harness ready={{ '/events': true }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    mockedPathname = '/events';
    rerender(<Harness ready={{ '/events': true }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
  });

  it('dismisses after the safety timer even if the fast-forwarded drawing never reports', () => {
    const { rerender } = render(<Harness ready={{ '/events': false }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    act(() => {
      captured.props?.onFrame?.({ p: 0.5 });
    });
    mockedPathname = '/events';
    rerender(<Harness ready={{ '/events': true }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'loading');
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
  });

  it('records the measured duration as a cold sample, then a warm sample on a repeat visit', () => {
    const { rerender } = render(<Harness ready={{ '/events': true, '/': true }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    mockedPathname = '/events';
    rerender(<Harness ready={{ '/events': true, '/': true }} />);
    act(() => {
      vi.advanceTimersByTime(LOADER_DISMISS_MS);
    });

    let stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '{}');
    expect(typeof stored['/events']?.cold).toBe('number');
    expect(stored['/events']?.warm).toBeUndefined();

    // Leave and come back: the same route is now a warm visit.
    mockedPathname = '/';
    rerender(<Harness ready={{ '/events': true, '/': true }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Go events' }));
    mockedPathname = '/events';
    rerender(<Harness ready={{ '/events': true, '/': true }} />);
    stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '{}');
    expect(typeof stored['/events']?.warm).toBe('number');
  });

  it('covers a hard load: the server render includes the overlay, and it dismisses on ready', () => {
    mockedPathname = '/tasks/daily';
    const html = renderToString(
      <ToastProvider>
        <TransitionProvider>
          <main />
        </TransitionProvider>
      </ToastProvider>,
    );
    expect(html).toContain('data-route-loader');
    expect(html).toContain('Loading Task Management');
    expect(html).toContain('data-visible="true"');
    expect(html).toContain('<noscript>');

    const { rerender } = render(<Harness ready={{ '/tasks/daily': false }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'loading');
    expect(screen.getByTestId('route-loader-zodiac')).toHaveAttribute('data-sign', 'aries');
    expect(document.documentElement.style.overflow).toBe('hidden');

    rerender(<Harness ready={{ '/tasks/daily': true }} />);
    expect(screen.getByTestId('route-loader')).toHaveAttribute('data-phase', 'leaving');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('leaves Home and unknown routes without a hard-load overlay', () => {
    mockedPathname = '/';
    render(<Harness ready={{}} />);
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
    cleanup();
    mockedPathname = '/definitely-not-a-route';
    render(<Harness ready={{}} />);
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
  });
});
