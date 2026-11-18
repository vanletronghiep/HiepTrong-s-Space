'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  getFeatureCollectionLayoutPreference,
  setFeatureCollectionLayoutPreference,
  type FeatureCollectionLayout,
} from '@/client/preferences';
import type { CollectionRevealState } from '@/features/home/home-journey';
import { FEATURE_REGISTRY } from '@/features/registry';
import { HorizontalGallery } from './HorizontalGallery';
import { VerticalGrid } from './VerticalGrid';
import styles from './feature-collection.module.css';

const FADE_OUT_MS = 150;
const FADE_IN_MS = 170;
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const COLLECTION_FEATURES = FEATURE_REGISTRY.filter((feature) => feature.id !== 'tasks-hub');

type LayoutTransitionPhase = 'idle' | 'fading-out' | 'fading-in';

export interface FeatureCollectionProps {
  revealState?: CollectionRevealState;
  revealComplete?: boolean;
  scrollStartOffset?: number;
  onRegisterReturnGuardReset?: (reset: (() => void) | null) => void;
}

export function FeatureCollection({
  revealState = 'revealed',
  revealComplete = true,
  scrollStartOffset,
  onRegisterReturnGuardReset,
}: FeatureCollectionProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const returnGuardArmRef = useRef<(() => void) | null>(null);
  const scrollStartOffsetRef = useRef(scrollStartOffset);

  const [selectedLayout, setSelectedLayout] = useState<FeatureCollectionLayout>('horizontal');
  const [renderedLayout, setRenderedLayout] = useState<FeatureCollectionLayout>('horizontal');
  const [transitionPhase, setTransitionPhase] = useState<LayoutTransitionPhase>('idle');
  const [lockedMinHeight, setLockedMinHeight] = useState<number | null>(null);
  const [focusRestoreTick, setFocusRestoreTick] = useState(0);

  const targetLayoutRef = useRef<FeatureCollectionLayout>('horizontal');
  const fadeOutTimerRef = useRef<number | null>(null);
  const fadeInTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const pendingFocusRestoreRef = useRef(false);

  const isRevealComplete = revealComplete && revealState === 'revealed';

  useIsomorphicLayoutEffect(() => {
    scrollStartOffsetRef.current = scrollStartOffset;
  }, [scrollStartOffset]);

  const clearTransitionTimers = useCallback(() => {
    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    if (fadeInTimerRef.current !== null) {
      window.clearTimeout(fadeInTimerRef.current);
      fadeInTimerRef.current = null;
    }
    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTransitionTimers(), [clearTransitionTimers]);

  useIsomorphicLayoutEffect(() => {
    const saved = getFeatureCollectionLayoutPreference();
    targetLayoutRef.current = saved;
    setSelectedLayout(saved);
    setRenderedLayout(saved);
  }, []);

  const handleRegisterReturnGuardArm = useCallback((arm: (() => void) | null) => {
    returnGuardArmRef.current = arm;
  }, []);

  // Keep user anchored at the start of the revealed collection so switching out of pinned horizontal
  // never strands the scroll position or returns into the reveal wipe (§9.9 & ui_readme.md §11.7).
  const scheduleScrollReset = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      returnGuardArmRef.current?.();
      const offset = scrollStartOffsetRef.current;
      if (typeof offset === 'number' && offset > 0) {
        window.scrollTo({ top: offset, behavior: 'auto' });
      } else {
        sectionRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
      }
    });
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!pendingFocusRestoreRef.current) {
      return;
    }
    pendingFocusRestoreRef.current = false;
    const container = controlsRef.current ?? sectionRef.current;
    if (!container) {
      return;
    }
    container
      .querySelector<HTMLButtonElement>('button[data-layout-toggle]')
      ?.focus({ preventScroll: true });
  }, [renderedLayout, focusRestoreTick]);

  const handleLayoutChange = (next: FeatureCollectionLayout) => {
    if (next === targetLayoutRef.current) {
      return;
    }

    targetLayoutRef.current = next;
    setSelectedLayout(next);
    setFeatureCollectionLayoutPreference(next);
    clearTransitionTimers();

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      pendingFocusRestoreRef.current = true;
      setLockedMinHeight(null);
      setTransitionPhase('idle');
      if (renderedLayout !== next) {
        setRenderedLayout(next);
        scheduleScrollReset();
      } else {
        setFocusRestoreTick((tick) => tick + 1);
      }
      return;
    }

    const measuredHeight =
      stageWrapRef.current?.getBoundingClientRect().height ||
      stageWrapRef.current?.offsetHeight ||
      0;
    if (measuredHeight > 0) {
      setLockedMinHeight((prev) => Math.max(prev ?? 0, Math.ceil(measuredHeight)));
    }

    if (renderedLayout === next) {
      pendingFocusRestoreRef.current = true;
      setTransitionPhase('fading-in');
      setFocusRestoreTick((tick) => tick + 1);
      fadeInTimerRef.current = window.setTimeout(() => {
        fadeInTimerRef.current = null;
        setTransitionPhase('idle');
        setLockedMinHeight(null);
      }, FADE_IN_MS);
      return;
    }

    setTransitionPhase('fading-out');
    fadeOutTimerRef.current = window.setTimeout(() => {
      fadeOutTimerRef.current = null;
      const finalTarget = targetLayoutRef.current;
      const preSwapHeight =
        stageWrapRef.current?.getBoundingClientRect().height ||
        stageWrapRef.current?.offsetHeight ||
        0;
      if (preSwapHeight > 0) {
        setLockedMinHeight((prev) => Math.max(prev ?? 0, Math.ceil(preSwapHeight)));
      }

      pendingFocusRestoreRef.current = true;
      setRenderedLayout(finalTarget);
      setTransitionPhase('fading-in');
      scheduleScrollReset();

      fadeInTimerRef.current = window.setTimeout(() => {
        fadeInTimerRef.current = null;
        setTransitionPhase('idle');
        setLockedMinHeight(null);
      }, FADE_IN_MS);
    }, FADE_OUT_MS);
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-labelledby="features-heading"
      className="relative w-full scroll-mt-0"
    >
      {/* Pre-blended radial gradients replacing runtime blur filters */}
      <div className={styles.collectionAmbient} aria-hidden="true">
        <div className={styles.collectionGlowLeft} />
        <div className={styles.collectionGlowRight} />
      </div>
      <div
        ref={stageWrapRef}
        data-layout-transition={transitionPhase}
        style={lockedMinHeight !== null ? { minHeight: `${lockedMinHeight}px` } : undefined}
        className={styles.layoutStage}
      >
        {renderedLayout === 'horizontal' ? (
          <HorizontalGallery
            features={COLLECTION_FEATURES}
            layout={selectedLayout}
            onLayoutChange={handleLayoutChange}
            revealComplete={isRevealComplete}
            scrollStartOffset={scrollStartOffset}
            controlsRef={controlsRef}
            onRegisterReturnGuardReset={onRegisterReturnGuardReset}
            onRegisterReturnGuardArm={handleRegisterReturnGuardArm}
          />
        ) : (
          <VerticalGrid
            features={COLLECTION_FEATURES}
            layout={selectedLayout}
            onLayoutChange={handleLayoutChange}
            revealComplete={isRevealComplete}
            controlsRef={controlsRef}
          />
        )}
      </div>
    </section>
  );
}
