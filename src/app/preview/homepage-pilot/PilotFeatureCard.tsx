'use client';

import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { cn } from '@/ui/cn';
import type { PilotFeatureEntry } from './homepage-pilot-fixtures';
import { PilotFeatureThumbnail } from './PilotFeatureThumbnail';
import styles from './homepage-pilot.module.css';

export interface PilotFeatureCardProps {
  feature: PilotFeatureEntry;
  className?: string;
}

export function PilotFeatureCard({ feature, className }: PilotFeatureCardProps) {
  return (
    <TransitionLink
      href={feature.href}
      data-feature-id={feature.id}
      style={{ '--card-accent': feature.accentVar } as CSSProperties}
      className={cn(styles.featureCard, className)}
    >
      <PilotFeatureThumbnail
        preset={feature.thumbnail.preset}
        imageUrl={feature.thumbnail.imageUrl}
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
