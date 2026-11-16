'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type Ref,
} from 'react';
import type { FeatureCollectionLayout } from '@/client/preferences';
import { clamp } from '@/features/home/home-journey';
import type { FeatureEntry } from '@/features/registry';
import { CollectionHeader } from './CollectionHeader';
import { FeatureCard } from './FeatureCard';
import type { ZodiacThumbnailControl } from './FeatureThumbnail';
import styles from './feature-collection.module.css';

const CARD_GAP = 24;
const TRACK_PAD_START = 24;
const WHEEL_GESTURE_GAP_MS = 220;
const WHEEL_RELEASE_THRESHOLD_PX = 120;
const TOUCH_RELEASE_THRESHOLD_PX = 24;
const RELEASE_OFFSET_PX = 8;
const IGNORED_OVERLAY_SELECTOR =
  '[role="dialog"], [data-overlay-popup="true"], input, textarea, select, [contenteditable="true"]';
const INTERACTIVE_CONTROL_SELECTOR =
  '[role="dialog"], [data-overlay-popup="true"], input, textarea, select, [contenteditable="true"], [role="radiogroup"], [role="radio"], [role="combobox"], [role="listbox"], [role="menu"], [role="slider"], [role="spinbutton"], [role="tablist"]';
const RETURN_NAV_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface HorizontalGalleryProps {
  features: readonly FeatureEntry[];
  layout: FeatureCollectionLayout;
  onLayoutChange: (next: FeatureCollectionLayout) => void;
  revealComplete?: boolean;
  scrollStartOffset?: number;
  controlsRef?: Ref<HTMLDivElement>;
  onRegisterReturnGuardReset?: (reset: (() => void) | null) => void;
  onRegisterReturnGuardArm?: (arm: (() => void) | null) => void;
  getZodiacControl?: (feature: FeatureEntry) => ZodiacThumbnailControl | undefined;
}

type ReturnBoundaryPhase = 'released' | 'browsing' | 'consuming' | 'armed';

interface TouchGestureSession {
  id: number;
  startX: number;
  startY: number;
  consumed: boolean;
}

function isMatchingSelector(target: EventTarget | null, selector: string): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest(selector));
}

function normalizeWheelDelta(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === 1) {
    return delta * 16;
  }
  if (deltaMode === 2) {
    return delta * pageSize;
  }
  return delta;
}

function useHorizontalReturnGuard({
  active,
  scrollStartOffset,
  onRegisterReset,
  onRegisterArm,
}: {
  active: boolean;
  scrollStartOffset: number | undefined;
  onRegisterReset?: (reset: (() => void) | null) => void;
  onRegisterArm?: (arm: (() => void) | null) => void;
}) {
  const onRegisterResetRef = useRef(onRegisterReset);
  const onRegisterArmRef = useRef(onRegisterArm);

  useIsomorphicLayoutEffect(() => {
    onRegisterResetRef.current = onRegisterReset;
    onRegisterArmRef.current = onRegisterArm;
  }, [onRegisterReset, onRegisterArm]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !active ||
      typeof scrollStartOffset !== 'number' ||
      scrollStartOffset <= 0
    ) {
      onRegisterResetRef.current?.(null);
      onRegisterArmRef.current?.(null);
      return undefined;
    }

    const boundary = scrollStartOffset;
    let phase: ReturnBoundaryPhase =
      window.scrollY > boundary
        ? 'browsing'
        : window.scrollY === boundary
          ? 'armed'
          : 'released';
    let wheelResistance = 0;
    let gestureIdleTimer: number | null = null;
    let touchSession: TouchGestureSession | null = null;
    let heldNavKey: string | null = null;

    const clearGestureIdleTimer = () => {
      if (gestureIdleTimer !== null) {
        window.clearTimeout(gestureIdleTimer);
        gestureIdleTimer = null;
      }
    };

    const scheduleGestureEnd = () => {
      clearGestureIdleTimer();
      gestureIdleTimer = window.setTimeout(() => {
        gestureIdleTimer = null;
        if (phase === 'consuming') {
          phase = 'armed';
          wheelResistance = 0;
        } else if (phase === 'armed') {
          wheelResistance = 0;
        }
      }, WHEEL_GESTURE_GAP_MS);
    };

    const clampToBoundary = () => {
      if (window.scrollY !== boundary) {
        window.scrollTo({ top: boundary, behavior: 'instant' });
      }
    };

    const resetToReleased = () => {
      clearGestureIdleTimer();
      phase = 'released';
      wheelResistance = 0;
      touchSession = null;
      heldNavKey = null;
    };

    const armAtBoundary = () => {
      clearGestureIdleTimer();
      phase = 'armed';
      wheelResistance = 0;
      touchSession = null;
      heldNavKey = null;
    };

    const releaseBackwardScroll = () => {
      resetToReleased();
      window.scrollTo({
        top: Math.max(0, boundary - RELEASE_OFFSET_PX),
        behavior: 'instant',
      });
    };

    onRegisterResetRef.current?.(resetToReleased);
    onRegisterArmRef.current?.(armAtBoundary);

    const handleScroll = () => {
      const y = window.scrollY;
      if (phase === 'released') {
        if (y > boundary) {
          phase = 'browsing';
          wheelResistance = 0;
        } else if (y === boundary) {
          phase = 'armed';
          wheelResistance = 0;
        }
        return;
      }

      if (phase === 'browsing') {
        if (y <= boundary) {
          if (y < boundary) {
            clampToBoundary();
          }
          phase = 'consuming';
          wheelResistance = 0;
          if (touchSession) {
            touchSession.consumed = true;
          } else if (!heldNavKey) {
            scheduleGestureEnd();
          }
        }
        return;
      }

      // phase === 'consuming' or phase === 'armed'
      if (y > boundary) {
        clearGestureIdleTimer();
        phase = 'browsing';
        wheelResistance = 0;
        return;
      }

      if (y < boundary) {
        clampToBoundary();
        if (phase === 'consuming' && !touchSession && !heldNavKey) {
          scheduleGestureEnd();
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || phase === 'released') {
        return;
      }
      if (isMatchingSelector(event.target, IGNORED_OVERLAY_SELECTOR)) {
        return;
      }

      const dy = normalizeWheelDelta(event.deltaY, event.deltaMode, window.innerHeight || 900);
      const dx = normalizeWheelDelta(event.deltaX, event.deltaMode, window.innerWidth || 1440);
      if (dy === 0 || (Math.abs(dx) > Math.abs(dy) && dx !== 0)) {
        return;
      }

      if (dy > 0) {
        clearGestureIdleTimer();
        wheelResistance = 0;
        if (window.scrollY > boundary) {
          phase = 'browsing';
        }
        return;
      }

      // Backward scroll (dy < 0)
      if (phase === 'browsing') {
        if (window.scrollY + dy <= boundary) {
          event.preventDefault();
          clampToBoundary();
          phase = 'consuming';
          wheelResistance = 0;
          scheduleGestureEnd();
        }
        return;
      }

      if (phase === 'consuming') {
        event.preventDefault();
        clampToBoundary();
        scheduleGestureEnd();
        return;
      }

      // phase === 'armed'
      wheelResistance += Math.abs(dy);
      if (wheelResistance >= WHEEL_RELEASE_THRESHOLD_PX) {
        event.preventDefault();
        releaseBackwardScroll();
        return;
      }

      event.preventDefault();
      clampToBoundary();
      scheduleGestureEnd();
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (phase === 'released' || event.touches.length !== 1) {
        touchSession = null;
        return;
      }
      if (isMatchingSelector(event.target, IGNORED_OVERLAY_SELECTOR)) {
        touchSession = null;
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      touchSession = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        consumed: phase === 'consuming',
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchSession || phase === 'released') {
        return;
      }
      if (isMatchingSelector(event.target, IGNORED_OVERLAY_SELECTOR)) {
        return;
      }
      const activeTouch =
        Array.from(event.touches).find((entry) => entry.identifier === touchSession?.id) ??
        event.touches[0];
      if (!activeTouch) {
        return;
      }

      const dx = activeTouch.clientX - touchSession.startX;
      const dy = activeTouch.clientY - touchSession.startY;
      if (Math.abs(dy) <= Math.abs(dx)) {
        return;
      }

      if (dy < 0) {
        if (window.scrollY > boundary) {
          phase = 'browsing';
          wheelResistance = 0;
        }
        return;
      }

      // Finger dragging down (dy > 0) scrolls upward toward the Homepage
      if (phase === 'browsing') {
        if (window.scrollY <= boundary) {
          event.preventDefault();
          clampToBoundary();
          phase = 'consuming';
          touchSession.consumed = true;
        }
        return;
      }

      if (phase === 'consuming' || touchSession.consumed) {
        event.preventDefault();
        clampToBoundary();
        return;
      }

      // phase === 'armed'
      if (dy >= TOUCH_RELEASE_THRESHOLD_PX) {
        event.preventDefault();
        releaseBackwardScroll();
        return;
      }

      event.preventDefault();
      clampToBoundary();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchSession) {
        return;
      }
      const stillActive = Array.from(event.touches).some(
        (entry) => entry.identifier === touchSession?.id,
      );
      if (stillActive) {
        return;
      }
      const wasConsumed = touchSession.consumed;
      touchSession = null;
      if (wasConsumed && phase === 'consuming') {
        clearGestureIdleTimer();
        phase = 'armed';
        wheelResistance = 0;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !RETURN_NAV_KEYS.has(event.key) ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        phase === 'released'
      ) {
        return;
      }
      if (
        isMatchingSelector(event.target, INTERACTIVE_CONTROL_SELECTOR) ||
        isMatchingSelector(document.activeElement, INTERACTIVE_CONTROL_SELECTOR)
      ) {
        return;
      }

      heldNavKey = event.key;

      if (phase === 'browsing') {
        if (window.scrollY <= boundary) {
          event.preventDefault();
          clampToBoundary();
          phase = 'consuming';
        }
        return;
      }

      if (phase === 'consuming') {
        event.preventDefault();
        clampToBoundary();
        return;
      }

      // phase === 'armed'
      if (event.repeat) {
        event.preventDefault();
        clampToBoundary();
        return;
      }

      event.preventDefault();
      releaseBackwardScroll();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!RETURN_NAV_KEYS.has(event.key)) {
        return;
      }
      if (heldNavKey === event.key) {
        heldNavKey = null;
      }
      if (phase === 'consuming') {
        clearGestureIdleTimer();
        phase = 'armed';
        wheelResistance = 0;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearGestureIdleTimer();
      onRegisterResetRef.current?.(null);
      onRegisterArmRef.current?.(null);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active, scrollStartOffset]);
}

interface StageMetrics {
  cardWidth: number;
  trackPadStart: number;
  trackPadEnd: number;
  travel: number;
  outerHeight: number;
}

function buildInitialStageMetrics(featureCount: number): StageMetrics {
  const stageW = 1440;
  const stageH = 900;
  const cardWidth = 588;
  const pairWidth = cardWidth * 2 + CARD_GAP;
  const trackPadStart = TRACK_PAD_START;
  const trackPadEnd = Math.max(20, Math.round((stageW - pairWidth) / 2));
  const gapCount = Math.max(0, featureCount - 1);
  const totalTrackWidth =
    trackPadStart + trackPadEnd + featureCount * cardWidth + gapCount * CARD_GAP;
  const travel = Math.max(0, totalTrackWidth - stageW);
  return {
    cardWidth,
    trackPadStart,
    trackPadEnd,
    travel,
    outerHeight: stageH + travel,
  };
}

function PinnedHorizontalStage({
  features,
  layout,
  onLayoutChange,
  revealComplete = true,
  scrollStartOffset,
  controlsRef,
  getZodiacControl,
}: HorizontalGalleryProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerWrapRef = useRef<HTMLDivElement>(null);
  const contentBoxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<StageMetrics>(() =>
    buildInitialStageMetrics(features.length),
  );
  const metricsRef = useRef(metrics);
  const outerTopRef = useRef(0);
  const stageHRef = useRef(900);
  const visualProgressRef = useRef(0);
  const snapNextRef = useRef(true);
  const rafIdRef = useRef(0);
  const prevTimeRef = useRef(0);
  const revealCompleteRef = useRef(revealComplete);
  const scrollStartOffsetRef = useRef(scrollStartOffset);
  const handleScrollRef = useRef<(() => void) | null>(null);

  const applyTransforms = useCallback((progress: number, travel: number) => {
    const trackEl = trackRef.current;
    const barEl = progressBarRef.current;
    if (trackEl) {
      trackEl.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
    }
    if (barEl) {
      barEl.style.transform = `scaleX(${progress})`;
    }
  }, []);

  const recalculate = useCallback(() => {
    const outerEl = outerRef.current;
    const stageEl = stageRef.current;
    const contentEl = contentBoxRef.current;
    const headerEl = headerWrapRef.current;
    if (!outerEl || !stageEl || !contentEl) {
      return;
    }

    const stageW = stageEl.clientWidth || window.innerWidth || 1280;
    const stageH = stageEl.clientHeight || window.innerHeight || 800;
    const innerContentW = contentEl.clientWidth || Math.min(stageW - 80, 1200);
    const headerH = headerEl?.offsetHeight || 96;

    const { paddingTop, paddingBottom } = getComputedStyle(stageEl);
    const stageInset = (parseFloat(paddingTop) || 0) + (parseFloat(paddingBottom) || 0);
    const maxByWidth = (innerContentW - CARD_GAP) / 2;
    const availableThumbnailHeight = stageH - headerH - stageInset - 106;
    const maxByHeight = availableThumbnailHeight * 1.6;
    const cardWidth = Math.max(280, Math.floor(Math.min(maxByWidth, maxByHeight)));

    const pairWidth = cardWidth * 2 + CARD_GAP;
    const trackPadStart = TRACK_PAD_START;
    const trackPadEnd = Math.max(20, Math.round((stageW - pairWidth) / 2));
    const gapCount = Math.max(0, features.length - 1);
    const totalTrackWidth =
      trackPadStart + trackPadEnd + features.length * cardWidth + gapCount * CARD_GAP;
    const travel = Math.max(0, totalTrackWidth - stageW);
    const outerHeight = stageH + travel;

    const explicitOffset = scrollStartOffsetRef.current;
    outerTopRef.current =
      typeof explicitOffset === 'number' && explicitOffset > 0
        ? explicitOffset
        : outerEl.getBoundingClientRect().top + window.scrollY;
    stageHRef.current = stageH;

    const nextMetrics: StageMetrics = {
      cardWidth,
      trackPadStart,
      trackPadEnd,
      travel,
      outerHeight,
    };
    metricsRef.current = nextMetrics;

    setMetrics((prev) => {
      if (
        prev.cardWidth === nextMetrics.cardWidth &&
        prev.trackPadStart === nextMetrics.trackPadStart &&
        prev.trackPadEnd === nextMetrics.trackPadEnd &&
        prev.travel === nextMetrics.travel &&
        prev.outerHeight === nextMetrics.outerHeight
      ) {
        return prev;
      }
      return nextMetrics;
    });

    const immediateProgress =
      revealCompleteRef.current && travel > 0
        ? clamp((window.scrollY - outerTopRef.current) / travel)
        : 0;
    if (!rafIdRef.current) {
      snapNextRef.current = false;
      visualProgressRef.current = immediateProgress;
      applyTransforms(immediateProgress, travel);
    }
  }, [applyTransforms, features.length]);

  useIsomorphicLayoutEffect(() => {
    scrollStartOffsetRef.current = scrollStartOffset;
    recalculate();
  }, [scrollStartOffset, recalculate]);

  useIsomorphicLayoutEffect(() => {
    revealCompleteRef.current = revealComplete;
    handleScrollRef.current?.();
  }, [revealComplete]);

  useEffect(() => {
    const outerEl = outerRef.current;
    const stageEl = stageRef.current;
    const headerEl = headerWrapRef.current;
    if (!outerEl || !stageEl) return undefined;

    const motion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let cancelled = false;

    const tick = (now: number) => {
      rafIdRef.current = 0;
      if (cancelled) return;

      const { travel } = metricsRef.current;
      const targetProgress =
        revealCompleteRef.current && travel > 0
          ? clamp((window.scrollY - outerTopRef.current) / travel)
          : 0;

      if (snapNextRef.current || motion?.matches) {
        visualProgressRef.current = targetProgress;
        snapNextRef.current = false;
        prevTimeRef.current = 0;
      } else {
        const dtMs = prevTimeRef.current > 0 ? Math.min(50, now - prevTimeRef.current) : 16.67;
        prevTimeRef.current = now;
        const alpha = 1 - Math.pow(1 - 0.22, Math.max(0.25, dtMs / 16.6667));
        const next =
          visualProgressRef.current + (targetProgress - visualProgressRef.current) * alpha;
        visualProgressRef.current =
          Math.abs(targetProgress - next) < 0.0002 ? targetProgress : next;
      }

      applyTransforms(visualProgressRef.current, travel);

      if (Math.abs(targetProgress - visualProgressRef.current) >= 0.0002 && !document.hidden) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      } else {
        prevTimeRef.current = 0;
      }
    };

    const scheduleTick = () => {
      if (!rafIdRef.current && !document.hidden) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      }
    };

    const handleScroll = () => {
      const { travel, outerHeight } = metricsRef.current;
      const top = outerTopRef.current;
      const inNeighborhood =
        window.scrollY + stageHRef.current >= top - 160 &&
        window.scrollY <= top + outerHeight + 160;

      if (!revealCompleteRef.current) {
        if (visualProgressRef.current > 0.0002 && inNeighborhood) {
          scheduleTick();
        } else if (visualProgressRef.current !== 0) {
          if (rafIdRef.current) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = 0;
          }
          prevTimeRef.current = 0;
          visualProgressRef.current = 0;
          applyTransforms(0, travel);
        }
        return;
      }

      if (inNeighborhood) {
        scheduleTick();
      } else {
        const edge = window.scrollY < top ? 0 : 1;
        if (visualProgressRef.current !== edge) {
          if (rafIdRef.current) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = 0;
          }
          prevTimeRef.current = 0;
          visualProgressRef.current = edge;
          applyTransforms(edge, travel);
        }
      }
    };

    handleScrollRef.current = handleScroll;
    const { travel } = metricsRef.current;
    const initialTarget =
      revealCompleteRef.current && travel > 0
        ? clamp((window.scrollY - outerTopRef.current) / travel)
        : 0;
    if (Math.abs(initialTarget - visualProgressRef.current) >= 0.0002) {
      handleScroll();
    }

    const handleVisibilityChange = () => {
      prevTimeRef.current = 0;
      if (document.hidden) {
        if (rafIdRef.current) {
          window.cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = 0;
        }
      } else {
        handleScroll();
      }
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        recalculate();
      });
      observer.observe(stageEl);
      if (headerEl) observer.observe(headerEl);
      const collectionSection = outerEl.closest('section');
      const precedingSection = collectionSection?.previousElementSibling;
      if (precedingSection instanceof Element) {
        observer.observe(precedingSection);
      }
      const introSection = collectionSection?.parentElement?.previousElementSibling;
      if (introSection instanceof Element) {
        observer.observe(introSection);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', recalculate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) {
          recalculate();
        }
      });
    }

    return () => {
      cancelled = true;
      handleScrollRef.current = null;
      observer?.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', recalculate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [applyTransforms, recalculate]);

  const keepFocusedCardVisible = (event: FocusEvent<HTMLDivElement>, index: number) => {
    const stage = stageRef.current;
    const outer = outerRef.current;
    if (!stage || !outer || !revealCompleteRef.current || !event.target.matches(':focus-visible')) {
      return;
    }

    // The stage only clips the track. Reveal keyboard focus on the document's scroll axis.
    const { travel, trackPadStart, cardWidth } = metricsRef.current;
    const explicitOffset = scrollStartOffsetRef.current;
    const start =
      typeof explicitOffset === 'number' && explicitOffset > 0
        ? explicitOffset
        : outer.getBoundingClientRect().top + window.scrollY;
    outerTopRef.current = start;
    const currentTravel = Math.min(travel, Math.max(0, window.scrollY - start));
    const left = trackPadStart + index * (cardWidth + CARD_GAP);
    const right = left + cardWidth;
    const inset = 12;
    const next = Math.min(
      travel,
      Math.max(
        0,
        Math.min(left - inset, Math.max(currentTravel, right + inset - stage.clientWidth)),
      ),
    );
    if (next !== currentTravel) {
      window.scrollTo({ top: start + next, behavior: 'instant' });
      const snappedProgress = travel > 0 ? clamp(next / travel) : 0;
      visualProgressRef.current = snappedProgress;
      snapNextRef.current = Boolean(rafIdRef.current);
      applyTransforms(snappedProgress, travel);
    }
  };

  return (
    <div
      ref={outerRef}
      data-testid="horizontal-pinned-outer"
      style={{ height: `${metrics.outerHeight}px` }}
      className="relative w-full"
    >
      <div
        ref={stageRef}
        data-collection-sticky
        className="sticky top-0 flex h-[100svh] w-full flex-col justify-between overflow-clip pb-10 pt-[calc(var(--journey-safe-top,40px)+16px)]"
      >
        {/* Pinned section header + inner content width probe */}
        <div
          ref={headerWrapRef}
          className="mx-auto w-full max-w-[var(--max-content)] px-[var(--gutter)] lg:px-[var(--gutter-lg)] shrink-0"
        >
          <div ref={contentBoxRef} className="w-full">
            <CollectionHeader
              layout={layout}
              onLayoutChange={onLayoutChange}
              controlsRef={controlsRef}
            />
          </div>
        </div>

        {/* Scroll-linked horizontal card track */}
        <div className="flex flex-1 items-center w-full overflow-visible">
          <div
            ref={trackRef}
            data-testid="horizontal-pinned-track"
            style={{
              paddingLeft: `${metrics.trackPadStart}px`,
              paddingRight: `${metrics.trackPadEnd}px`,
              gap: `${CARD_GAP}px`,
              willChange: 'transform',
            }}
            className="flex items-start"
          >
            {features.map((feature, index) => (
              <div
                key={feature.id}
                style={{ width: `${metrics.cardWidth}px` }}
                className="shrink-0"
                onFocus={(event) => keepFocusedCardVisible(event, index)}
              >
                <FeatureCard
                  feature={feature}
                  revealComplete={revealComplete}
                  zodiacControl={getZodiacControl?.(feature)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Minimal 120px non-interactive progress hairline per ui_readme.md §11.4 */}
        <div
          aria-hidden="true"
          className="mx-auto flex w-full max-w-[var(--max-content)] items-center justify-center px-[var(--gutter)] lg:px-[var(--gutter-lg)] shrink-0"
        >
          <div className={styles.progressTrack}>
            <div ref={progressBarRef} className={styles.progressFill} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NativeSnapHorizontalGallery({
  features,
  layout,
  onLayoutChange,
  revealComplete = true,
  controlsRef,
  getZodiacControl,
}: HorizontalGalleryProps) {
  return (
    <div
      data-testid="horizontal-native-gallery"
      className="w-full pb-20 pt-[calc(var(--journey-safe-top,64px)+16px)]"
    >
      <div className="mx-auto w-full max-w-[var(--max-content)] px-[var(--gutter)] lg:px-[var(--gutter-lg)]">
        <CollectionHeader
          layout={layout}
          onLayoutChange={onLayoutChange}
          controlsRef={controlsRef}
        />

        <div
          role="region"
          aria-label="Feature cards horizontal gallery"
          tabIndex={0}
          className="mt-8 -mx-2 flex gap-5 overflow-x-auto px-2 py-2 pb-4 snap-x snap-proximity scroll-px-2 focus-visible:outline-2 focus-visible:outline-[var(--cosmos-focus)] focus-visible:outline-offset-4 rounded-card"
        >
          {features.map((feature) => (
            <div
              key={feature.id}
              className="snap-start shrink-0 w-[84%] sm:w-[74%] md:w-[calc((100%-20px)/2)]"
            >
              <FeatureCard
                feature={feature}
                revealComplete={revealComplete}
                zodiacControl={getZodiacControl?.(feature)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HorizontalGallery(props: HorizontalGalleryProps) {
  const [canPin, setCanPin] = useState(false);

  useHorizontalReturnGuard({
    active: props.revealComplete ?? true,
    scrollStartOffset: props.scrollStartOffset,
    onRegisterReset: props.onRegisterReturnGuardReset,
    onRegisterArm: props.onRegisterReturnGuardArm,
  });

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mqDesktop = window.matchMedia('(min-width: 1024px) and (min-height: 520px)');
    const mqFine = window.matchMedia('(pointer: fine)');
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      setCanPin(mqDesktop.matches && mqFine.matches && !mqReduced.matches);
    };

    evaluate();
    mqDesktop.addEventListener('change', evaluate);
    mqFine.addEventListener('change', evaluate);
    mqReduced.addEventListener('change', evaluate);

    return () => {
      mqDesktop.removeEventListener('change', evaluate);
      mqFine.removeEventListener('change', evaluate);
      mqReduced.removeEventListener('change', evaluate);
    };
  }, []);

  if (canPin) {
    return <PinnedHorizontalStage {...props} />;
  }

  return <NativeSnapHorizontalGallery {...props} />;
}
