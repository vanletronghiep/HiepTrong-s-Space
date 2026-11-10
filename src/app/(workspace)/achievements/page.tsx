import type { Metadata } from 'next';
import { AchievementsView } from '@/features/achievements/AchievementsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('achievements');

export const metadata: Metadata = {
  title: feature?.title ?? 'Personal Achievements',
};

export default function AchievementsPage() {
  return <AchievementsView />;
}
