'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getFeatureCollectionLayoutPreference,
  setFeatureCollectionLayoutPreference,
  type FeatureCollectionLayout,
} from '@/client/preferences';
import { FEATURE_REGISTRY } from '@/features/registry';
import { HorizontalGallery } from './HorizontalGallery';
import { VerticalGrid } from './VerticalGrid';

export function FeatureCollection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<FeatureCollectionLayout>('horizontal');

  useEffect(() => {
    setLayout(getFeatureCollectionLayoutPreference());
  }, []);

  const handleLayoutChange = (next: FeatureCollectionLayout) => {
    if (next === layout) {
      return;
    }
    setLayout(next);
    setFeatureCollectionLayoutPreference(next);

    // Keep user anchored at the start of the collection so switching out of pinned horizontal
    // never strands the scroll position below the shortened section (§9.9 & ui_readme.md §11.7).
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-labelledby="features-heading"
      className="relative w-full scroll-mt-4"
    >
      <div
        className="pointer-events-none absolute inset-0 -top-32 overflow-hidden -z-10"
        aria-hidden="true"
      >
        <div
          className="absolute left-[12%] top-[5%] w-[60vw] max-w-[850px] aspect-square rounded-full blur-[90px]"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--cosmos-accent) 12%, transparent) 0%, color-mix(in srgb, var(--cosmos-accent) 3%, transparent) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute right-[8%] top-[30%] w-[55vw] max-w-[750px] aspect-square rounded-full blur-[100px]"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--daily-planet) 10%, transparent) 0%, color-mix(in srgb, var(--daily-planet) 2%, transparent) 55%, transparent 72%)',
          }}
        />
      </div>
      {layout === 'horizontal' ? (
        <HorizontalGallery
          features={FEATURE_REGISTRY}
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
      ) : (
        <VerticalGrid
          features={FEATURE_REGISTRY}
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
      )}
    </section>
  );
}
