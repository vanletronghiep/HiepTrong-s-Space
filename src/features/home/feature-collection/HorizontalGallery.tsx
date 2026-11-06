'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { FeatureCollectionLayout } from '@/client/preferences';
import type { FeatureEntry } from '@/features/registry';
import { CollectionHeader } from './CollectionHeader';
import { FeatureCard } from './FeatureCard';

const CARD_GAP = 24;

export interface HorizontalGalleryProps {
  features: readonly FeatureEntry[];
  layout: FeatureCollectionLayout;
  onLayoutChange: (next: FeatureCollectionLayout) => void;
}

interface StageMetrics {
  cardWidth: number;
  trackPadX: number;
  travel: number;
  outerHeight: number;
}

function PinnedHorizontalStage({ features, layout, onLayoutChange }: HorizontalGalleryProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerWrapRef = useRef<HTMLDivElement>(null);
  const contentBoxRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<StageMetrics>({
    cardWidth: 540,
    trackPadX: 40,
    travel: 540 * 11 + CARD_GAP * 11,
    outerHeight: 900 + 540 * 11 + CARD_GAP * 11,
  });

  const recalculate = useCallback(() => {
    const stageEl = stageRef.current;
    const contentEl = contentBoxRef.current;
    const headerEl = headerWrapRef.current;
    if (!stageEl || !contentEl) {
      return;
    }

    const stageW = stageEl.clientWidth || window.innerWidth || 1280;
    const stageH = stageEl.clientHeight || window.innerHeight || 800;
    const innerContentW = contentEl.clientWidth || Math.min(stageW - 80, 1200);
    const headerH = headerEl?.offsetHeight ?? 96;

    const { paddingTop, paddingBottom } = getComputedStyle(stageEl);
    const stageInset = (parseFloat(paddingTop) || 0) + (parseFloat(paddingBottom) || 0);
    const maxByWidth = (innerContentW - CARD_GAP) / 2;
    const availableThumbnailHeight = stageH - headerH - stageInset - 102;
    const maxByHeight = availableThumbnailHeight * 1.6;
    const cardWidth = Math.max(280, Math.floor(Math.min(maxByWidth, maxByHeight)));

    const pairWidth = cardWidth * 2 + CARD_GAP;
    const trackPadX = Math.max(20, Math.round((stageW - pairWidth) / 2));
    const totalTrackWidth =
      trackPadX * 2 + features.length * cardWidth + Math.max(0, features.length - 1) * CARD_GAP;
    const travel = Math.max(0, totalTrackWidth - stageW);
    const outerHeight = stageH + travel;

    setMetrics((prev) => {
      if (
        prev.cardWidth === cardWidth &&
        prev.trackPadX === trackPadX &&
        prev.travel === travel &&
        prev.outerHeight === outerHeight
      ) {
        return prev;
      }
      return { cardWidth, trackPadX, travel, outerHeight };
    });
  }, [features.length]);

  useLayoutEffect(() => {
    recalculate();
  }, [recalculate]);

  useEffect(() => {
    const stageEl = stageRef.current;
    const headerEl = headerWrapRef.current;
    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        recalculate();
      });
      if (stageEl) observer.observe(stageEl);
      if (headerEl) observer.observe(headerEl);
    }

    window.addEventListener('resize', recalculate);
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) {
          recalculate();
        }
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener('resize', recalculate);
    };
  }, [recalculate]);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  const translateX = useTransform(scrollYProgress, [0, 1], [0, -metrics.travel]);

  const keepFocusedCardVisible = (event: FocusEvent<HTMLDivElement>, index: number) => {
    const stage = stageRef.current;
    const outer = outerRef.current;
    if (!stage || !outer || !event.target.matches(':focus-visible')) return;

    // The stage only clips the track. Reveal keyboard focus on the document's scroll axis.
    const start = outer.getBoundingClientRect().top + window.scrollY;
    const travel = Math.min(metrics.travel, Math.max(0, window.scrollY - start));
    const left = metrics.trackPadX + index * (metrics.cardWidth + CARD_GAP);
    const right = left + metrics.cardWidth;
    const inset = 12;
    const next = Math.min(
      metrics.travel,
      Math.max(0, Math.min(left - inset, Math.max(travel, right + inset - stage.clientWidth))),
    );
    if (next !== travel) window.scrollTo({ top: start + next, behavior: 'instant' });
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
            <CollectionHeader layout={layout} onLayoutChange={onLayoutChange} />
          </div>
        </div>

        {/* Scroll-linked horizontal card track */}
        <div className="flex flex-1 items-center w-full overflow-visible">
          <motion.div
            data-testid="horizontal-pinned-track"
            style={{
              x: translateX,
              paddingLeft: `${metrics.trackPadX}px`,
              paddingRight: `${metrics.trackPadX}px`,
              gap: `${CARD_GAP}px`,
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
                <FeatureCard feature={feature} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Minimal 120px non-interactive progress hairline per ui_readme.md §11.4 */}
        <div
          aria-hidden="true"
          className="mx-auto flex w-full max-w-[var(--max-content)] items-center justify-center px-[var(--gutter)] lg:px-[var(--gutter-lg)] shrink-0"
        >
          <div className="relative h-px w-[120px] overflow-hidden bg-[color-mix(in_srgb,var(--cosmos-text)_20%,transparent)]">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-full w-full origin-left bg-[color-mix(in_srgb,var(--cosmos-text)_60%,transparent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NativeSnapHorizontalGallery({ features, layout, onLayoutChange }: HorizontalGalleryProps) {
  return (
    <div
      data-testid="horizontal-native-gallery"
      className="w-full pb-20 pt-[calc(var(--journey-safe-top,64px)+16px)]"
    >
      <div className="mx-auto w-full max-w-[var(--max-content)] px-[var(--gutter)] lg:px-[var(--gutter-lg)]">
        <CollectionHeader layout={layout} onLayoutChange={onLayoutChange} />

        <div
          role="region"
          aria-label="Feature cards horizontal gallery"
          tabIndex={0}
          className="mt-10 flex gap-5 overflow-x-auto pb-4 snap-x snap-proximity scroll-px-1 focus-visible:outline-2 focus-visible:outline-[var(--cosmos-focus)] focus-visible:outline-offset-4 rounded-card"
        >
          {features.map((feature) => (
            <div
              key={feature.id}
              className="snap-start shrink-0 w-[84%] sm:w-[74%] md:w-[calc((100%-20px)/2)]"
            >
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HorizontalGallery(props: HorizontalGalleryProps) {
  const [canPin, setCanPin] = useState(false);

  useEffect(() => {
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
