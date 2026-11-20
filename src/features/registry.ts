import { isRouteHidden } from '@/domain/feature-visibility';
import type { ZodiacSign } from '@/features/zodiac/types';

export type FeatureThumbnailPreset =
  | 'constellation-arc'
  | 'dual-orbit'
  | 'meridian-grid'
  | 'neural-lattice'
  | 'manuscript-lines'
  | 'academic-compass'
  | 'paired-cards'
  | 'harmonic-waves'
  | 'pulse-timeline'
  | 'blueprint-vectors'
  | 'summit-trajectory'
  | 'focus-aperture'
  | 'zenith-crown';

export interface FeatureEntry {
  id: string;
  slug: string;
  title: string;
  label: string;
  href: string;
  status: 'built' | 'blank';
  thumbnail: {
    preset: FeatureThumbnailPreset;
    accent: 'lavender' | 'blue';
    imageUrl?: string;
    zodiacSign?: ZodiacSign;
  };
}

export const FEATURE_REGISTRY: readonly FeatureEntry[] = [
  {
    id: 'daily-tasks',
    slug: 'daily',
    title: 'Task Management',
    label: 'Tasks',
    href: '/tasks/daily',
    status: 'built',
    thumbnail: { preset: 'constellation-arc', accent: 'lavender', zodiacSign: 'aries' },
  },
  {
    id: 'tasks-hub',
    slug: 'hub',
    title: 'Tasks Hub',
    label: 'Tasks',
    href: '/tasks/hub',
    status: 'built',
    thumbnail: { preset: 'dual-orbit', accent: 'blue' },
  },
  {
    id: 'events',
    slug: 'events',
    title: 'Events',
    label: 'Schedule',
    href: '/events',
    status: 'built',
    thumbnail: { preset: 'meridian-grid', accent: 'lavender', zodiacSign: 'taurus' },
  },
  {
    id: 'ai-engineering',
    slug: 'ai-engineering',
    title: 'AI Engineering',
    label: 'Learning',
    href: '/ai-engineering',
    status: 'built',
    thumbnail: { preset: 'neural-lattice', accent: 'blue', zodiacSign: 'gemini' },
  },
  {
    id: 'blogs',
    slug: 'blogs',
    title: 'Writing Room',
    label: 'Writing',
    href: '/writing',
    status: 'built',
    thumbnail: { preset: 'manuscript-lines', accent: 'lavender', zodiacSign: 'cancer' },
  },
  {
    id: 'apcs',
    slug: 'apcs',
    title: 'APCS Hub',
    label: 'University',
    href: '/apcs',
    status: 'built',
    thumbnail: { preset: 'academic-compass', accent: 'blue', zodiacSign: 'leo' },
  },
  {
    id: 'flashcards',
    slug: 'flashcards',
    title: 'Flashcards',
    label: 'Learning',
    href: '/flashcards',
    status: 'built',
    thumbnail: { preset: 'paired-cards', accent: 'lavender', zodiacSign: 'virgo' },
  },
  {
    id: 'entertainment',
    slug: 'entertainment',
    title: 'Entertainment Hub',
    label: 'Personal',
    href: '/entertainment',
    status: 'built',
    thumbnail: { preset: 'harmonic-waves', accent: 'blue', zodiacSign: 'libra' },
  },
  {
    id: 'tracking',
    slug: 'tracking',
    title: 'Tracking',
    label: 'Tracking',
    href: '/tracking',
    status: 'built',
    thumbnail: { preset: 'pulse-timeline', accent: 'lavender', zodiacSign: 'scorpio' },
  },
  {
    id: 'projects',
    slug: 'projects',
    title: 'Current Focus',
    label: 'Projects',
    href: '/focus',
    status: 'built',
    thumbnail: { preset: 'blueprint-vectors', accent: 'blue', zodiacSign: 'sagittarius' },
  },
  {
    id: 'milestones',
    slug: 'milestones',
    title: 'Annual Milestones',
    label: 'Personal',
    href: '/milestones',
    status: 'built',
    thumbnail: { preset: 'summit-trajectory', accent: 'lavender', zodiacSign: 'capricorn' },
  },
  {
    id: 'learning-room',
    slug: 'learning-room',
    title: 'Focus Room',
    label: 'Learning',
    href: '/focus-room',
    status: 'built',
    thumbnail: { preset: 'focus-aperture', accent: 'blue', zodiacSign: 'aquarius' },
  },
  {
    id: 'achievements',
    slug: 'achievements',
    title: 'Personal Achievements',
    label: 'Personal',
    href: '/achievements',
    status: 'built',
    thumbnail: { preset: 'zenith-crown', accent: 'lavender', zodiacSign: 'pisces' },
  },
] as const;

/** Registry entries that are not hidden; drives homepage, universe menu and route loader. */
export const VISIBLE_FEATURES: readonly FeatureEntry[] = FEATURE_REGISTRY.filter(
  (entry) => !isRouteHidden(entry.href),
);

export function getFeatureById(id: string): FeatureEntry | undefined {
  return FEATURE_REGISTRY.find((entry) => entry.id === id);
}

export function getFeatureByHref(href: string): FeatureEntry | undefined {
  return FEATURE_REGISTRY.find((entry) => entry.href === href);
}
