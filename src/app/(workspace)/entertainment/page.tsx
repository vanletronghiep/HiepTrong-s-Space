import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isRouteHidden } from '@/domain/feature-visibility';
import { EntertainmentView } from '@/features/entertainment/EntertainmentView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('entertainment');

export const metadata: Metadata = {
  title: feature?.title ?? 'Entertainment Hub',
};

export default function EntertainmentPage() {
  if (isRouteHidden('/entertainment')) notFound();
  return <EntertainmentView />;
}
