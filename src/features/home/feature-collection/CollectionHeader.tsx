'use client';

import type { FeatureCollectionLayout } from '@/client/preferences';
import { SegmentedControl, type SegmentedOption } from '@/ui/SegmentedControl';
import { cn } from '@/ui/cn';
import styles from '../home-journey.module.css';

const LAYOUT_OPTIONS: readonly SegmentedOption<FeatureCollectionLayout>[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

export interface CollectionHeaderProps {
  layout: FeatureCollectionLayout;
  onLayoutChange: (next: FeatureCollectionLayout) => void;
  className?: string;
}

export function CollectionHeader({ layout, onLayoutChange, className }: CollectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <h2
        id="features-heading"
        tabIndex={-1}
        className={cn(styles.collectionHeading, 'text-cosmos-text')}
      >
        Explore my space
      </h2>

      <SegmentedControl
        tone="cosmos"
        aria-label="Feature collection layout"
        options={LAYOUT_OPTIONS}
        value={layout}
        onChange={onLayoutChange}
      />
    </div>
  );
}
