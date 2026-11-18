import type { Metadata } from 'next';
import { ApcsView } from '@/features/apcs/ApcsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('apcs');

export const metadata: Metadata = {
  title: feature?.title ?? 'APCS Hub',
};

export default function ApcsPage() {
  return <ApcsView />;
}
