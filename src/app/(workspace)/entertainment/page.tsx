import type { Metadata } from 'next';
import { EntertainmentView } from '@/features/entertainment/EntertainmentView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('entertainment');

export const metadata: Metadata = {
  title: feature?.title ?? 'Entertainment Hub',
};

export default function EntertainmentPage() {
  return <EntertainmentView />;
}
