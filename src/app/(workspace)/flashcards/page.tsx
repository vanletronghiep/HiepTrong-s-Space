import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isRouteHidden } from '@/domain/feature-visibility';
import { FlashcardsView } from '@/features/flashcards/FlashcardsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('flashcards');

export const metadata: Metadata = {
  title: feature?.title ?? 'Flashcards',
};

export default function FlashcardsPage() {
  if (isRouteHidden('/flashcards')) notFound();
  return <FlashcardsView />;
}
