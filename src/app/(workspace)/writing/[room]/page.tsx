import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrivateRoom } from '@/features/writing/PrivateRoom';
import { RoomWorkspace } from '@/features/writing/RoomWorkspace';

const ROOM_TITLE = {
  drafts: 'Draft Room',
  perspective: 'My Perspective',
  private: 'Private Room',
} as const;

type RoomKey = keyof typeof ROOM_TITLE;

function isRoom(value: string): value is RoomKey {
  return value in ROOM_TITLE;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ room: string }>;
}): Promise<Metadata> {
  const { room } = await params;
  return { title: isRoom(room) ? ROOM_TITLE[room] : 'Writing Room' };
}

export default async function WritingRoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  if (!isRoom(room)) notFound();
  if (room === 'private') return <PrivateRoom />;
  return <RoomWorkspace room={room} />;
}
