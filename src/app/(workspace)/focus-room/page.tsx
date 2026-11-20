import type { Metadata } from 'next';
import { FocusRoomView } from '@/features/focus-room/FocusRoomView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('learning-room');

export const metadata: Metadata = {
  title: feature?.title ?? 'Focus Room',
};

export default function FocusRoomPage() {
  return <FocusRoomView />;
}
