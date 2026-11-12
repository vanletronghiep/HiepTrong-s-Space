import { PageReady } from '@/features/transitions/TransitionProvider';
import type { Metadata } from 'next';
import { AiEngineeringView } from '@/features/ai-engineering/AiEngineeringView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('ai-engineering');

export const metadata: Metadata = {
  title: feature?.title ?? 'AI Engineering',
};

export default function AiEngineeringPage() {
  return <><PageReady /><AiEngineeringView /></>;
}
