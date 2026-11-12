import { PageReady } from '@/features/transitions/TransitionProvider';
import type { Metadata } from 'next';
import { FlashcardsView } from '@/features/flashcards/FlashcardsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('flashcards');

export const metadata: Metadata = {
  title: feature?.title ?? 'Flashcards',
};

export default function FlashcardsPage() {
  return <><PageReady /><FlashcardsView /></>;
}
