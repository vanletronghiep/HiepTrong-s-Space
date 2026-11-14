'use client';

import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { FeatureEntry } from '@/features/registry';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { cn } from '@/ui/cn';
import { FeatureThumbnail } from './FeatureThumbnail';
import styles from './feature-collection.module.css';

const FEATURE_ACCENT_VARS: Record<string, string> = {
  'daily-tasks': 'var(--cosmos-lavender)',
  'tasks-hub': 'var(--cosmos-star-blue)',
  events: 'color-mix(in srgb, var(--cosmos-star-blue) 68%, var(--daily-planet-optional-light))',
  'ai-engineering':
    'color-mix(in srgb, var(--daily-planet-optional-light) 72%, var(--cosmos-star-pale))',
  blogs: 'color-mix(in srgb, var(--journey-flare-gold) 74%, var(--cosmos-star-white))',
  apcs: 'var(--cosmos-star-pale)',
  flashcards: 'color-mix(in srgb, var(--journey-flare-gold) 58%, var(--cosmos-lavender))',
  entertainment: 'color-mix(in srgb, var(--cosmos-lavender) 64%, var(--daily-planet-urgent-light))',
  tracking: 'var(--status-notif-completed)',
  projects: 'color-mix(in srgb, var(--daily-planet-urgent-light) 55%, var(--journey-flare-gold))',
  milestones: 'var(--journey-flare-gold)',
  'learning-room':
    'color-mix(in srgb, var(--daily-planet-optional-light) 60%, var(--cosmos-lavender))',
  achievements: 'color-mix(in srgb, var(--journey-flare-gold) 65%, var(--cosmos-star-white))',
};

export function getFeatureAccentVar(feature: FeatureEntry): string {
  return (
    FEATURE_ACCENT_VARS[feature.id] ??
    (feature.thumbnail.accent === 'lavender' ? 'var(--cosmos-lavender)' : 'var(--cosmos-star-blue)')
  );
}

export interface FeatureCardProps {
  feature: FeatureEntry;
  className?: string;
}

/**
 * Shared Feature Collection card (identical across Horizontal and Vertical layouts)
 * per agent_readme.md §9.9 and ui_readme.md §11.3.
 */
export function FeatureCard({ feature, className }: FeatureCardProps) {
  return (
    <TransitionLink
      href={feature.href}
      data-feature-id={feature.id}
      style={{ '--card-accent': getFeatureAccentVar(feature) } as CSSProperties}
      className={cn(styles.featureCard, className)}
    >
      <FeatureThumbnail thumbnail={feature.thumbnail} />

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
