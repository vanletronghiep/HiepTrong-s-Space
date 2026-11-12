import { PageReady } from '@/features/transitions/TransitionProvider';
import type { Metadata } from 'next';
import { LearningRoomView } from '@/features/learning-room/LearningRoomView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('learning-room');

export const metadata: Metadata = {
  title: feature?.title ?? 'Learning Room',
};

export default function LearningRoomPage() {
  return <><PageReady /><LearningRoomView /></>;
}
