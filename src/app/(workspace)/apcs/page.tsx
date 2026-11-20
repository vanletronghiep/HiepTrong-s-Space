import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isRouteHidden } from '@/domain/feature-visibility';
import { ApcsView } from '@/features/apcs/ApcsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('apcs');

export const metadata: Metadata = {
  title: feature?.title ?? 'APCS Hub',
};

export default function ApcsPage() {
  if (isRouteHidden('/apcs')) notFound();
  return <ApcsView />;
}
