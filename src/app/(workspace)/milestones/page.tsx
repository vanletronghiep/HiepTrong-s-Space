import { PageReady } from '@/features/transitions/TransitionProvider';
import type { Metadata } from 'next';
import { MilestonesView } from '@/features/milestones/MilestonesView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('milestones');

export const metadata: Metadata = {
  title: feature?.title ?? 'Milestone',
};

export default function MilestonesPage() {
  return <><PageReady /><MilestonesView /></>;
}
