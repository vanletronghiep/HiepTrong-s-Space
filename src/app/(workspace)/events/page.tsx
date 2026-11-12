import { PageReady } from '@/features/transitions/TransitionProvider';
import type { Metadata } from 'next';
import { EventsView } from '@/features/events/EventsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('events');

export const metadata: Metadata = {
  title: feature?.title ?? 'Events & Exams',
};

export default function EventsPage() {
  return <><PageReady /><EventsView /></>;
}
