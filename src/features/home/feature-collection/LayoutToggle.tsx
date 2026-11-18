'use client';

import { GalleryHorizontal, LayoutGrid } from 'lucide-react';
import type { FeatureCollectionLayout } from '@/client/preferences';
import styles from './feature-collection.module.css';

const MODES = {
  horizontal: { label: 'Gallery', Icon: GalleryHorizontal },
  vertical: { label: 'Grid', Icon: LayoutGrid },
} as const;

export interface LayoutToggleProps {
  layout: FeatureCollectionLayout;
  onLayoutChange: (next: FeatureCollectionLayout) => void;
}

/**
 * Single morphing view-mode button (v3.2). Shows the current mode; pressing swaps to the other.
 * Both icon/label pairs share one grid cell so the pill width never jumps during the morph.
 */
export function LayoutToggle({ layout, onLayoutChange }: LayoutToggleProps) {
  const next: FeatureCollectionLayout = layout === 'horizontal' ? 'vertical' : 'horizontal';
  const current = MODES[layout];
  const target = MODES[next];

  return (
    <button
      type="button"
      data-layout-toggle
      data-mode={layout}
      aria-label={`${current.label} view, switch to ${target.label.toLowerCase()} view`}
      title={`Switch to ${target.label.toLowerCase()} view`}
      onClick={() => onLayoutChange(next)}
      className={styles.layoutToggle}
    >
      <span aria-hidden="true" className={styles.layoutToggleIcons}>
        {(Object.keys(MODES) as FeatureCollectionLayout[]).map((mode) => {
          const { Icon } = MODES[mode];
          return (
            <Icon
              key={mode}
              size={16}
              strokeWidth={1.6}
              data-active={mode === layout}
              className={styles.layoutToggleIcon}
            />
          );
        })}
      </span>
      <span aria-hidden="true" className={styles.layoutToggleLabels}>
        {(Object.keys(MODES) as FeatureCollectionLayout[]).map((mode) => (
          <span key={mode} data-active={mode === layout} className={styles.layoutToggleLabel}>
            {MODES[mode].label}
          </span>
        ))}
      </span>
    </button>
  );
}
