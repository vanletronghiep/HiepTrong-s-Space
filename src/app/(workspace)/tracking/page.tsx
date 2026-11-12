import { PageReady } from '@/features/transitions/TransitionProvider';
import type { Metadata } from 'next';
import { TrackingView } from '@/features/tracking/TrackingView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('tracking');

export const metadata: Metadata = {
  title: feature?.title ?? 'Tracking',
};

export default function TrackingPage() {
  return <><PageReady /><TrackingView /></>;
}
