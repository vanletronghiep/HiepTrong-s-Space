'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getRouteLoadHistoryRaw, setRouteLoadHistoryRaw } from '@/client/preferences';
import { getCachedZodiacAsset } from '@/features/zodiac/loader';
import type { ZodiacSign } from '@/features/zodiac/types';
import { useToast } from '@/ui/Toast';
import {
  FAST_UPGRADE_DRAW_MS,
  FAST_UPGRADE_MS,
  FINISH_NOW_MS,
  decideLoadPath,
  estimateLoadMs,
  parseLoadHistory,
  recordLoadMs,
  type LoadKind,
} from './load-estimate';
import {
  getRouteAccent,
  getRouteLoadingLabel,
  getRouteZodiacSign,
  isHardLoadRoute,
} from './route-zodiac';
import { normalizePathname, parseInternalHref, shouldTriggerRouteLoader } from './transition-rules';
import {
  ZodiacLoaderOverlay,
  type RouteLoaderMode,
  type RouteLoaderPath,
  type RouteLoaderPhase,
} from './ZodiacLoaderOverlay';

/** Safety net: reveal whatever the destination has rendered instead of trapping the user. */
export const FAILSAFE_REVEAL_MS = 10_000;
/** Opacity dismissal uses the --dur-fast motion token; interaction is released before it starts. */
export const LOADER_DISMISS_MS = 150;
const QUICK_FADE_HOLD_MS = 60;
const QUICK_FADE_TOTAL_MS = 260;

export interface TransitionContextValue {
  isTransitioning: boolean;
  isOverlayActive: boolean;
  navigate: (href: string, options?: { replace?: boolean }) => void;
  signalPageReady: (pathname: string) => void;
  registerNavigationGuard: (guard: ((proceed: () => void) => boolean) | null) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lockDocumentScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.setAttribute('aria-busy', 'true');
}

function unlockDocumentScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.style.overflow = '';
  document.documentElement.removeAttribute('aria-busy');
}

function focusDestinationHeading(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const heading =
    document.querySelector<HTMLElement>('main h1') ??
    document.querySelector<HTMLElement>('h1') ??
    document.querySelector<HTMLElement>('main');

  if (!heading) {
    return;
  }

  if (!heading.hasAttribute('tabindex')) {
    heading.setAttribute('tabindex', '-1');
  }
  heading.focus({ preventScroll: true });
}

interface OverlayState {
  /** Navigation that owns this overlay; stale timers and signals compare against it. */
  navigationId: number;
  mode: RouteLoaderMode;
  phase: RouteLoaderPhase;
  sign: ZodiacSign | null;
  label: string;
  accent: string;
  reducedMotion: boolean;
  path: RouteLoaderPath;
  drawMs?: number;
  finishNow: boolean;
  /** Hard load / refresh: rendered visible from the server's first paint. */
  initiallyVisible: boolean;
}

function planLoad(pathname: string, sign: ZodiacSign | null, kind: LoadKind) {
  const history = parseLoadHistory(getRouteLoadHistoryRaw());
  const estimate = estimateLoadMs({
    history,
    pathname,
    kind,
    assetCached: sign === null || getCachedZodiacAsset(sign) !== null,
  });
  return decideLoadPath(estimate);
}

/** Overlay that is part of the server render for hard loads and refreshes (estimate applied after mount). */
function buildHardLoadOverlay(pathname: string): OverlayState | null {
  if (!isHardLoadRoute(pathname)) return null;
  const sign = getRouteZodiacSign(pathname);
  return {
    navigationId: 1,
    mode: sign ? 'zodiac' : 'text',
    phase: 'loading',
    sign,
    label: getRouteLoadingLabel(pathname),
    accent: getRouteAccent(pathname),
    reducedMotion: false,
    path: 'pending',
    finishNow: false,
    initiallyVisible: true,
  };
}

/**
 * Readiness-driven route transitions (v3.1 §3.2).
 * Navigation starts immediately; the destination zodiac (or a neutral loader) covers the
 * route until that destination signals a usable surface. There is no minimum display time.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const rawPathname = usePathname() ?? '/';
  const currentPathname = normalizePathname(rawPathname);
  const { pushToast } = useToast();

  const [initialOverlay] = useState(() => buildHardLoadOverlay(currentPathname));
  const [isTransitioning, setIsTransitioning] = useState(initialOverlay !== null);
  const [overlay, setOverlay] = useState<OverlayState | null>(initialOverlay);

  const isTransitioningRef = useRef(initialOverlay !== null);
  const navigationIdRef = useRef(initialOverlay ? 1 : 0);
  const targetPathnameRef = useRef<string | null>(initialOverlay ? currentPathname : null);
  const hardLoadRef = useRef(initialOverlay !== null);
  const overlayRef = useRef<OverlayState | null>(overlay);
  const navStartRef = useRef(0);
  const kindRef = useRef<LoadKind>('cold');
  const visitedRef = useRef<Set<string>>(new Set());
  const drawProgressRef = useRef(0);
  const pendingFinishRef = useRef<{ navigationId: number; restoreFocus: boolean } | null>(null);
  /** Readiness collected for the active navigation only; cleared when a navigation starts. */
  const readyPathnamesRef = useRef<Set<string>>(new Set());
  const currentPathnameRef = useRef(currentPathname);
  const timersRef = useRef<number[]>([]);
  const navigationGuardRef = useRef<((proceed: () => void) => boolean) | null>(null);

  currentPathnameRef.current = currentPathname;
  overlayRef.current = overlay;

  const registerNavigationGuard = useCallback(
    (guard: ((proceed: () => void) => boolean) | null) => {
      navigationGuardRef.current = guard;
    },
    [],
  );

  const clearAllTimers = useCallback(() => {
    if (typeof window !== 'undefined') {
      for (const timer of timersRef.current) {
        window.clearTimeout(timer);
      }
    }
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((callback: () => void, delayMs: number) => {
    const id = window.setTimeout(callback, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  /** Releases scroll and interaction immediately, then fades the overlay out. */
  const completeNavigation = useCallback(
    (navigationId: number, restoreHeadingFocus: boolean) => {
      if (navigationId !== navigationIdRef.current || !isTransitioningRef.current) {
        return;
      }
      clearAllTimers();
      isTransitioningRef.current = false;
      targetPathnameRef.current = null;
      readyPathnamesRef.current = new Set();
      pendingFinishRef.current = null;
      drawProgressRef.current = 0;
      unlockDocumentScroll();
      setIsTransitioning(false);
      setOverlay((prev) =>
        prev && prev.navigationId === navigationId ? { ...prev, phase: 'leaving' } : prev,
      );
      scheduleTimer(() => {
        setOverlay((prev) => (prev && prev.navigationId === navigationId ? null : prev));
      }, LOADER_DISMISS_MS);

      if (restoreHeadingFocus && typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          focusDestinationHeading();
        });
      }
    },
    [clearAllTimers, scheduleTimer],
  );

  /** Called as the drawing advances; finishes a pending (fast-forwarded) dismissal when drawn. */
  const handleDrawProgress = useCallback(
    (progress: number) => {
      drawProgressRef.current = progress;
      const pending = pendingFinishRef.current;
      if (pending && progress >= 0.999) {
        completeNavigation(pending.navigationId, pending.restoreFocus);
      }
    },
    [completeNavigation],
  );

  /** Page is ready: record the duration, then dismiss (fast-forwarding a mid-flight drawing first). */
  const finishNavigation = useCallback(
    (navigationId: number, restoreFocus: boolean, pathname: string) => {
      const duration = performance.now() - navStartRef.current;
      setRouteLoadHistoryRaw(
        JSON.stringify(
          recordLoadMs(
            parseLoadHistory(getRouteLoadHistoryRaw()),
            pathname,
            kindRef.current,
            duration,
          ),
        ),
      );
      visitedRef.current.add(pathname);

      const current = overlayRef.current;
      const progress = drawProgressRef.current;
      const midDrawing =
        current?.mode === 'zodiac' &&
        current.path === 'draw' &&
        !current.reducedMotion &&
        progress > 0.05 &&
        progress < 0.999;
      if (!midDrawing) {
        completeNavigation(navigationId, restoreFocus);
        return;
      }
      pendingFinishRef.current = { navigationId, restoreFocus };
      setOverlay((prev) =>
        prev && prev.navigationId === navigationId ? { ...prev, finishNow: true } : prev,
      );
      // Safety net: never wait longer than the fast-forward plus a small margin.
      scheduleTimer(() => completeNavigation(navigationId, restoreFocus), FINISH_NOW_MS + 250);
    },
    [completeNavigation, scheduleTimer],
  );

  const evaluateReadiness = useCallback(() => {
    if (!isTransitioningRef.current) {
      return;
    }
    const target = targetPathnameRef.current;
    if (!target) {
      return;
    }
    if (currentPathnameRef.current === target && readyPathnamesRef.current.has(target)) {
      if (pendingFinishRef.current) {
        return;
      }
      finishNavigation(navigationIdRef.current, !hardLoadRef.current, target);
    }
  }, [finishNavigation]);

  useEffect(() => {
    evaluateReadiness();
  }, [currentPathname, evaluateReadiness]);

  const signalPageReady = useCallback(
    (pathname: string) => {
      if (!isTransitioningRef.current) {
        return;
      }
      readyPathnamesRef.current.add(normalizePathname(pathname));
      evaluateReadiness();
    },
    [evaluateReadiness],
  );

  // Browser Back/Forward keeps a lightweight fade; it also abandons any pending loader.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      if (isTransitioningRef.current) {
        completeNavigation(navigationIdRef.current, false);
        return;
      }
      clearAllTimers();
      const navigationId = ++navigationIdRef.current;
      setOverlay({
        navigationId,
        mode: 'quick-fade',
        phase: 'loading',
        sign: null,
        label: '',
        accent: '',
        reducedMotion: isReducedMotionPreferred(),
        path: 'fast',
        finishNow: false,
        initiallyVisible: false,
      });
      scheduleTimer(() => {
        setOverlay((prev) =>
          prev && prev.navigationId === navigationId ? { ...prev, phase: 'leaving' } : prev,
        );
      }, QUICK_FADE_HOLD_MS);
      scheduleTimer(() => {
        setOverlay((prev) => (prev && prev.navigationId === navigationId ? null : prev));
      }, QUICK_FADE_TOTAL_MS);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [clearAllTimers, completeNavigation, scheduleTimer]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      unlockDocumentScroll();
    };
  }, [clearAllTimers]);

  const performRouterNavigation = useCallback(
    (href: string, replace?: boolean) => {
      startTransition(() => {
        if (replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      });
    },
    [router],
  );

  const executeNavigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      // Ignore repeated clicks while a route loader is pending.
      if (isTransitioningRef.current) {
        return;
      }

      const parsed = parseInternalHref(href);

      // Same-pathname query/hash changes and external hrefs navigate without a loader.
      if (
        !parsed ||
        !shouldTriggerRouteLoader({
          href,
          currentPathname: currentPathnameRef.current,
          isTransitioning: isTransitioningRef.current,
        })
      ) {
        performRouterNavigation(href, options?.replace);
        return;
      }

      const navigationId = ++navigationIdRef.current;
      try {
        clearAllTimers();
        isTransitioningRef.current = true;
        targetPathnameRef.current = parsed.pathname;
        readyPathnamesRef.current = new Set();

        const sign = getRouteZodiacSign(parsed.pathname);
        hardLoadRef.current = false;
        navStartRef.current = performance.now();
        kindRef.current = visitedRef.current.has(parsed.pathname) ? 'warm' : 'cold';
        drawProgressRef.current = 0;
        pendingFinishRef.current = null;
        const plan = planLoad(parsed.pathname, sign, kindRef.current);
        lockDocumentScroll();
        setIsTransitioning(true);
        setOverlay({
          navigationId,
          mode: sign ? 'zodiac' : 'text',
          phase: 'loading',
          sign,
          label: getRouteLoadingLabel(parsed.pathname),
          accent: getRouteAccent(parsed.pathname),
          reducedMotion: isReducedMotionPreferred(),
          path: plan.path,
          drawMs: plan.path === 'draw' ? plan.drawMs : undefined,
          finishNow: false,
          initiallyVisible: false,
        });

        // A "fast" route that is still loading shortly after starts drawing instead of sitting static.
        if (sign && plan.path === 'fast') {
          scheduleTimer(() => {
            if (navigationId !== navigationIdRef.current || !isTransitioningRef.current) return;
            setOverlay((prev) =>
              prev && prev.navigationId === navigationId && prev.path === 'fast'
                ? { ...prev, path: 'draw', drawMs: FAST_UPGRADE_DRAW_MS }
                : prev,
            );
          }, FAST_UPGRADE_MS);
        }

        // Navigation starts immediately; the loader never delays it.
        performRouterNavigation(href, options?.replace);

        scheduleTimer(() => {
          if (navigationId !== navigationIdRef.current || !isTransitioningRef.current) return;
          console.warn(
            `[RouteLoader] Destination "${parsed.pathname}" did not signal readiness within 10s; revealing page.`,
          );
          completeNavigation(navigationId, true);
        }, FAILSAFE_REVEAL_MS);
      } catch (error: unknown) {
        console.error('[RouteLoader] Navigation error:', error);
        completeNavigation(navigationId, false);
        pushToast('Navigation encountered an issue.', 'error');
        performRouterNavigation(href, options?.replace);
      }
    },
    [clearAllTimers, completeNavigation, performRouterNavigation, pushToast, scheduleTimer],
  );

  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      if (isTransitioningRef.current) {
        return;
      }

      const guard = navigationGuardRef.current;
      if (guard && guard(() => executeNavigate(href, options))) {
        return;
      }

      executeNavigate(href, options);
    },
    [executeNavigate],
  );

  const handleOverlayRuntimeError = useCallback(() => {
    // The boundary already swapped in the text-only loader; nothing else to release.
  }, []);

  // Hard load / refresh: the server-rendered overlay gets its estimate and failsafe after mount.
  useEffect(() => {
    if (!hardLoadRef.current || !isTransitioningRef.current) {
      return;
    }
    lockDocumentScroll();
    const pathname = targetPathnameRef.current ?? currentPathnameRef.current;
    const sign = getRouteZodiacSign(pathname);
    const plan = planLoad(pathname, sign, 'cold');
    setOverlay((prev) =>
      prev
        ? {
            ...prev,
            reducedMotion: isReducedMotionPreferred(),
            path: plan.path,
            drawMs: plan.path === 'draw' ? plan.drawMs : undefined,
          }
        : prev,
    );
    const navigationId = navigationIdRef.current;
    scheduleTimer(() => {
      if (navigationId !== navigationIdRef.current || !isTransitioningRef.current) return;
      console.warn(
        `[RouteLoader] Destination "${pathname}" did not signal readiness within 10s; revealing page.`,
      );
      completeNavigation(navigationId, false);
    }, FAILSAFE_REVEAL_MS);
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOverlayActive = overlay !== null;

  const value = useMemo<TransitionContextValue>(
    () => ({
      isTransitioning,
      isOverlayActive,
      navigate,
      signalPageReady,
      registerNavigationGuard,
    }),
    [isOverlayActive, isTransitioning, navigate, registerNavigationGuard, signalPageReady],
  );

  return (
    <TransitionContext.Provider value={value}>
      {children}
      {overlay ? (
        <ZodiacLoaderOverlay
          key={overlay.navigationId}
          mode={overlay.mode}
          phase={overlay.phase}
          sign={overlay.sign}
          label={overlay.label}
          accent={overlay.accent || undefined}
          reducedMotion={overlay.reducedMotion}
          path={overlay.path}
          drawMs={overlay.drawMs}
          finishNow={overlay.finishNow}
          initiallyVisible={overlay.initiallyVisible}
          onDrawProgress={handleDrawProgress}
          onRuntimeError={handleOverlayRuntimeError}
        />
      ) : null}
    </TransitionContext.Provider>
  );
}

export function useIsTransitioning(): boolean {
  const ctx = useContext(TransitionContext);
  return Boolean(ctx?.isTransitioning || ctx?.isOverlayActive);
}

export function useTransitionRouter(): {
  push: (href: string) => void;
  replace: (href: string) => void;
  isTransitioning: boolean;
} {
  const ctx = useContext(TransitionContext);
  const fallbackRouter = useRouter();

  const push = useCallback(
    (href: string) => {
      if (ctx) {
        ctx.navigate(href);
      } else {
        fallbackRouter.push(href);
      }
    },
    [ctx, fallbackRouter],
  );

  const replace = useCallback(
    (href: string) => {
      if (ctx) {
        ctx.navigate(href, { replace: true });
      } else {
        fallbackRouter.replace(href);
      }
    },
    [ctx, fallbackRouter],
  );

  return {
    push,
    replace,
    isTransitioning: ctx?.isTransitioning ?? false,
  };
}

/**
 * Signals that the current route shows a usable primary surface (or a visible error/retry
 * state). Destinations must not signal while their primary data is still loading.
 */
export function usePageReady(ready: boolean = true): void {
  const ctx = useContext(TransitionContext);
  const pathname = usePathname();

  useEffect(() => {
    if (ready && ctx && pathname) {
      ctx.signalPageReady(pathname);
    }
  }, [ready, ctx, pathname]);
}

export function PageReady({ ready = true }: { ready?: boolean }) {
  usePageReady(ready);
  return null;
}

export function useNavigationGuard(
  enabled: boolean,
  onAttemptNavigate: (proceed: () => void) => void,
): void {
  const ctx = useContext(TransitionContext);
  const callbackRef = useRef(onAttemptNavigate);

  useEffect(() => {
    callbackRef.current = onAttemptNavigate;
  }, [onAttemptNavigate]);

  useEffect(() => {
    if (!ctx || !enabled) {
      return undefined;
    }
    const guard = (proceed: () => void) => {
      callbackRef.current(proceed);
      return true;
    };
    ctx.registerNavigationGuard(guard);
    return () => {
      ctx.registerNavigationGuard(null);
    };
  }, [ctx, enabled]);
}
