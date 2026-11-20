import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isRouteHidden } from '@/domain/feature-visibility';
import { AchievementsView } from '@/features/achievements/AchievementsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('achievements');

export const metadata: Metadata = {
  title: feature?.title ?? 'Personal Achievements',
};

export default function AchievementsPage() {
  if (isRouteHidden('/achievements')) notFound();
  return <AchievementsView />;
}
