'use client';

import type { Ref } from 'react';
import type { FeatureCollectionLayout } from '@/client/preferences';
import { COLLECTION_SUBTITLE_COPY } from '@/features/home/home-journey';
import { SegmentedControl, type SegmentedOption } from '@/ui/SegmentedControl';
import { cn } from '@/ui/cn';
import styles from './feature-collection.module.css';

const LAYOUT_OPTIONS: readonly SegmentedOption<FeatureCollectionLayout>[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

export interface CollectionHeaderProps {
  layout: FeatureCollectionLayout;
  onLayoutChange: (next: FeatureCollectionLayout) => void;
  controlsRef?: Ref<HTMLDivElement>;
  className?: string;
}

export function CollectionHeader({
  layout,
  onLayoutChange,
  controlsRef,
  className,
}: CollectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div>
        <h2 id="features-heading" tabIndex={-1} className={styles.collectionHeading}>
          My <span className={styles.collectionHeadingEmphasis}>collection</span>
        </h2>
        <p className={styles.collectionSubtitle}>{COLLECTION_SUBTITLE_COPY}</p>
      </div>

      <div ref={controlsRef} data-collection-controls data-layout-mode={layout}>
        <SegmentedControl
          tone="cosmos"
          aria-label="Feature collection layout"
          options={LAYOUT_OPTIONS}
          value={layout}
          onChange={onLayoutChange}
        />
      </div>
    </div>
  );
}
