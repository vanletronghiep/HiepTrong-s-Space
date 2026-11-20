import type { Metadata } from 'next';
import { WritingRoomView } from '@/features/writing/WritingRoomView';

export const metadata: Metadata = {
  title: 'Writing Room',
};

export default function WritingPage() {
  return <WritingRoomView />;
}
