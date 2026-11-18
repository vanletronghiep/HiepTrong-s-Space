import type { Metadata } from 'next';
import { WritingRoomView } from '@/features/blogs/WritingRoomView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('blogs');

export const metadata: Metadata = {
  title: feature?.title ?? 'The Writing Room',
};

export default function BlogsPage() {
  return <WritingRoomView />;
}
