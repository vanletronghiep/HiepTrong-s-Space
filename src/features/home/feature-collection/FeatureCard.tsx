'use client';

import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { FeatureEntry } from '@/features/registry';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { cn } from '@/ui/cn';
import { getFeatureAccentVar } from './feature-accent';
import { FeatureThumbnail, type ZodiacThumbnailControl } from './FeatureThumbnail';
import styles from './feature-collection.module.css';

export { getFeatureAccentVar };

export interface FeatureCardProps {
  feature: FeatureEntry;
  revealComplete?: boolean;
  zodiacControl?: ZodiacThumbnailControl;
  className?: string;
}

/**
 * Shared Feature Collection card (identical across Horizontal and Vertical layouts)
 * per agent_readme.md §9.9 and ui_readme.md §11.3.
 */
export function FeatureCard({
  feature,
  revealComplete = true,
  zodiacControl,
  className,
}: FeatureCardProps) {
  return (
    <TransitionLink
      href={feature.href}
      data-feature-id={feature.id}
      style={{ '--card-accent': getFeatureAccentVar(feature) } as CSSProperties}
      className={cn(styles.featureCard, className)}
    >
      <FeatureThumbnail
        thumbnail={feature.thumbnail}
        illuminationEnabled={revealComplete}
        zodiacControl={zodiacControl}
      />

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className={styles.categoryPill}>{feature.label}</span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h3 className={styles.cardTitle}>{feature.title}</h3>
        <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden="true" className={styles.cardArrow} />
      </div>
    </TransitionLink>
  );
}
