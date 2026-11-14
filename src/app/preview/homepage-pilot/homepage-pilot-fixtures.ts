import {
  readDraftStorageRaw,
  writeDraftStorageRaw,
  type FeatureCollectionLayout,
} from '@/client/preferences';
import { clamp, ease, mix } from '@/features/home/home-journey';

export type PilotFeaturePreset =
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

export interface PilotFeatureEntry {
  id: string;
  slug: string;
  title: string;
  label: string;
  href: string;
  status: 'built' | 'blank';
  thumbnail: {
    preset: PilotFeaturePreset;
    accent: 'lavender' | 'blue';
    imageUrl?: string;
  };
  accentVar: string;
}

export interface PilotNotificationFixture {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  unread: boolean;
}

export const PILOT_LAYOUT_STORAGE_KEY = 'hts.pilot.featureCollection.layout';

export const PILOT_INTRO_COPY = {
  heading: "Hi! I'm Hiep.",
  lead: 'A first-year student in the Advanced Program in Computer Science at HCMUS.',
  body: 'Passionate about AI, Machine Learning, and their applications. I enjoy solving problems, exploring new technologies, and turning ideas into real projects.',
  closing: 'Less talk. More action. Keep building.',
} as const;

export const PILOT_NOTIFICATIONS: readonly PilotNotificationFixture[] = [
  {
    id: 'pilot-notif-1',
    title: 'CS162 midterm study sprint',
    detail: 'Scheduled for 19:30 in Daily Task Management.',
    timeLabel: '18m ago',
    unread: true,
  },
  {
    id: 'pilot-notif-2',
    title: 'Paper review note synced',
    detail: 'AI Engineering draft saved locally.',
    timeLabel: '2h ago',
    unread: true,
  },
] as const;

/**
 * Read-only fixture entries mirroring the 13 FEATURE_REGISTRY destinations in exact order,
 * paired with per-feature CSS token accent expressions derived strictly from tokens.css.
 */
export const PILOT_FEATURES: readonly PilotFeatureEntry[] = [
  {
    id: 'daily-tasks',
    slug: 'daily',
    title: 'Daily Task Management',
    label: 'Tasks',
    href: '/tasks/daily',
    status: 'built',
    thumbnail: { preset: 'constellation-arc', accent: 'lavender' },
    accentVar: 'var(--cosmos-lavender)',
  },
  {
    id: 'tasks-hub',
    slug: 'hub',
    title: 'Tasks Hub',
    label: 'Tasks',
    href: '/tasks/hub',
    status: 'built',
    thumbnail: { preset: 'dual-orbit', accent: 'blue' },
    accentVar: 'var(--cosmos-star-blue)',
  },
  {
    id: 'events',
    slug: 'events',
    title: 'Events',
    label: 'Schedule',
    href: '/events',
    status: 'built',
    thumbnail: { preset: 'meridian-grid', accent: 'lavender' },
    accentVar:
      'color-mix(in srgb, var(--cosmos-star-blue) 68%, var(--daily-planet-optional-light))',
  },
  {
    id: 'ai-engineering',
    slug: 'ai-engineering',
    title: 'AI Engineering',
    label: 'Learning',
    href: '/ai-engineering',
    status: 'built',
    thumbnail: { preset: 'neural-lattice', accent: 'blue' },
    accentVar:
      'color-mix(in srgb, var(--daily-planet-optional-light) 72%, var(--cosmos-star-pale))',
  },
  {
    id: 'blogs',
    slug: 'blogs',
    title: 'Blogs Hub',
    label: 'Writing',
    href: '/blogs',
    status: 'built',
    thumbnail: { preset: 'manuscript-lines', accent: 'lavender' },
    accentVar: 'color-mix(in srgb, var(--journey-flare-gold) 74%, var(--cosmos-star-white))',
  },
  {
    id: 'apcs',
    slug: 'apcs',
    title: 'APCS Hub',
    label: 'University',
    href: '/apcs',
    status: 'built',
    thumbnail: { preset: 'academic-compass', accent: 'blue' },
    accentVar: 'var(--cosmos-star-pale)',
  },
  {
    id: 'flashcards',
    slug: 'flashcards',
    title: 'Flashcards',
    label: 'Learning',
    href: '/flashcards',
    status: 'built',
    thumbnail: { preset: 'paired-cards', accent: 'lavender' },
    accentVar: 'color-mix(in srgb, var(--journey-flare-gold) 58%, var(--cosmos-lavender))',
  },
  {
    id: 'entertainment',
    slug: 'entertainment',
    title: 'Entertainment Hub',
    label: 'Personal',
    href: '/entertainment',
    status: 'built',
    thumbnail: { preset: 'harmonic-waves', accent: 'blue' },
    accentVar: 'color-mix(in srgb, var(--cosmos-lavender) 64%, var(--daily-planet-urgent-light))',
  },
  {
    id: 'tracking',
    slug: 'tracking',
    title: 'Tracking',
    label: 'Tracking',
    href: '/tracking',
    status: 'built',
    thumbnail: { preset: 'pulse-timeline', accent: 'lavender' },
    accentVar: 'var(--status-notif-completed)',
  },
  {
    id: 'projects',
    slug: 'projects',
    title: 'In Progress Projects',
    label: 'Projects',
    href: '/projects',
    status: 'built',
    thumbnail: { preset: 'blueprint-vectors', accent: 'blue' },
    accentVar:
      'color-mix(in srgb, var(--daily-planet-urgent-light) 55%, var(--journey-flare-gold))',
  },
  {
    id: 'milestones',
    slug: 'milestones',
    title: 'Annual Milestones',
    label: 'Personal',
    href: '/milestones',
    status: 'built',
    thumbnail: { preset: 'summit-trajectory', accent: 'lavender' },
    accentVar: 'var(--journey-flare-gold)',
  },
  {
    id: 'learning-room',
    slug: 'learning-room',
    title: 'Learning Room',
    label: 'Learning',
    href: '/learning-room',
    status: 'built',
    thumbnail: { preset: 'focus-aperture', accent: 'blue' },
    accentVar: 'color-mix(in srgb, var(--daily-planet-optional-light) 60%, var(--cosmos-lavender))',
  },
  {
    id: 'achievements',
    slug: 'achievements',
    title: 'Personal Achievements',
    label: 'Personal',
    href: '/achievements',
    status: 'built',
    thumbnail: { preset: 'zenith-crown', accent: 'lavender' },
    accentVar: 'color-mix(in srgb, var(--journey-flare-gold) 65%, var(--cosmos-star-white))',
  },
] as const;

export function getPilotLayoutPreference(): FeatureCollectionLayout {
  const result = readDraftStorageRaw(PILOT_LAYOUT_STORAGE_KEY);
  if (result.ok && (result.raw === 'horizontal' || result.raw === 'vertical')) {
    return result.raw;
  }
  return 'horizontal';
}

export function setPilotLayoutPreference(layout: FeatureCollectionLayout): void {
  writeDraftStorageRaw(PILOT_LAYOUT_STORAGE_KEY, layout);
}

export type PilotViewportMode = 'desktop' | 'landscape-compact' | 'stacked';

export interface PilotEarthPose {
  mode: PilotViewportMode;
  diameter: number;
  fullDiameter: number;
  centerX: number;
  centerY: number;
}

export function getPilotViewportMode(width: number, height: number): PilotViewportMode {
  if (width >= 1024) {
    return 'desktop';
  }
  if (width >= 560 && height < 520) {
    return 'landscape-compact';
  }
  return 'stacked';
}

export function pilotEarthPose(
  width: number,
  height: number,
  progress: number,
  introHeight = 0,
): PilotEarthPose {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const mode = getPilotViewportMode(safeW, safeH);

  let openingDiameter: number;
  let openingCenterY: number;
  let fullDiameter: number;
  let restCenterX: number;
  let restCenterY: number;

  if (mode === 'desktop') {
    openingDiameter = safeW * 2;
    openingCenterY = safeH * 0.58 + openingDiameter / 2;
    fullDiameter = Math.min(safeW * 0.38, safeH * 0.56, 520);
    restCenterX = safeW * 0.24;
    restCenterY = safeH * 0.52;
  } else if (mode === 'landscape-compact') {
    const headerReserve = 58;
    const usableH = Math.max(120, safeH - headerReserve - 20);
    openingDiameter = safeW * 1.8;
    openingCenterY = safeH * 0.6 + openingDiameter / 2;
    fullDiameter = Math.min(safeW * 0.32, usableH * 0.84, 240);
    restCenterX = safeW * 0.2;
    restCenterY = headerReserve + (safeH - headerReserve) * 0.5;
  } else {
    const phone = safeW < 768;
    const headerReserve = phone ? 76 : 102;
    const bottomMargin = phone ? 28 : 44;
    const minGap = 24;
    const effectiveIntroH = introHeight > 0 ? introHeight : phone ? 290 : 260;
    const introTopY = safeH - bottomMargin - effectiveIntroH;
    const availableSky = Math.max(120, introTopY - minGap - headerReserve);

    openingDiameter = safeW * (phone ? 2.2 : 2);
    openingCenterY = safeH * (phone ? 0.6 : 0.58) + openingDiameter / 2;
    fullDiameter = Math.min(safeW * (phone ? 0.72 : 0.52), availableSky * 0.86, 380);
    restCenterX = safeW / 2;
    restCenterY = headerReserve + (availableSky - fullDiameter) * 0.52 + fullDiameter / 2;
  }

  const zoom = ease(clamp(progress / 0.44));
  const shift = ease(clamp((progress - 0.44) / 0.34));

  return {
    mode,
    diameter: mix(openingDiameter, fullDiameter, zoom),
    fullDiameter,
    centerX: mix(safeW / 2, restCenterX, shift),
    centerY: mix(openingCenterY, restCenterY, zoom),
  };
}
