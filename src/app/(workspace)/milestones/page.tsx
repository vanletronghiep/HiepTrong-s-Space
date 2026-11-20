import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isRouteHidden } from '@/domain/feature-visibility';
import { MilestonesView } from '@/features/milestones/MilestonesView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('milestones');

export const metadata: Metadata = {
  title: feature?.title ?? 'Milestone',
};

export default function MilestonesPage() {
  if (isRouteHidden('/milestones')) notFound();
  return <MilestonesView />;
}
