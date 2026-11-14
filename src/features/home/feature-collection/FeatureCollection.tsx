'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface FeatureCollectionProps {
  revealState?: CollectionRevealState;
  revealComplete?: boolean;
  scrollStartOffset?: number;
}

export function FeatureCollection({
  revealState = 'revealed',
  revealComplete = true,
  scrollStartOffset,
}: FeatureCollectionProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<FeatureCollectionLayout>('horizontal');
  const isRevealComplete = revealComplete && revealState === 'revealed';

  useIsomorphicLayoutEffect(() => {
    setLayout(getFeatureCollectionLayoutPreference());
  }, []);

  const handleLayoutChange = (next: FeatureCollectionLayout) => {
    if (next === layout) {
      return;
    }
    setLayout(next);
    setFeatureCollectionLayoutPreference(next);

    // Keep user anchored at the start of the revealed collection so switching out of pinned horizontal
    // never strands the scroll position or returns into the reveal wipe (§9.9 & ui_readme.md §11.7).
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        if (typeof scrollStartOffset === 'number' && scrollStartOffset > 0) {
          window.scrollTo({ top: scrollStartOffset, behavior: 'auto' });
        } else {
          sectionRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
        }
      });
    }
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
      {layout === 'horizontal' ? (
        <HorizontalGallery
          features={FEATURE_REGISTRY}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          revealComplete={isRevealComplete}
          scrollStartOffset={scrollStartOffset}
        />
      ) : (
        <VerticalGrid
          features={FEATURE_REGISTRY}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          revealComplete={isRevealComplete}
        />
      )}
    </section>
  );
}
