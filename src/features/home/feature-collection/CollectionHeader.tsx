'use client';

import type { Ref } from 'react';
import type { FeatureCollectionLayout } from '@/client/preferences';
import { COLLECTION_SUBTITLE_COPY } from '@/features/home/home-journey';
import { cn } from '@/ui/cn';
import { LayoutToggle } from './LayoutToggle';
import styles from './feature-collection.module.css';

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
        <LayoutToggle layout={layout} onLayoutChange={onLayoutChange} />
      </div>
    </div>
  );
}
