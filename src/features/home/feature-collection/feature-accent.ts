import type { FeatureEntry } from '@/features/registry';

/** Pure accent lookup shared by collection cards and the route loader (no React imports). */
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
