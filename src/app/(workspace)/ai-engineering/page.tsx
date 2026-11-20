import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isRouteHidden } from '@/domain/feature-visibility';
import { AiEngineeringView } from '@/features/ai-engineering/AiEngineeringView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('ai-engineering');

export const metadata: Metadata = {
  title: feature?.title ?? 'AI Engineering',
};

export default function AiEngineeringPage() {
  if (isRouteHidden('/ai-engineering')) notFound();
  return <AiEngineeringView />;
}
