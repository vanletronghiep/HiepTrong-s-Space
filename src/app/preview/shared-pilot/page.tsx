import type { Metadata } from 'next';
import { PageReady } from '@/features/transitions/TransitionProvider';
import { SharedPilotView } from './SharedPilotView';

export const metadata: Metadata = {
  title: 'Shared Notes & Controls Pilot',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SharedPilotPage() {
  return (
    <>
      <PageReady />
      <SharedPilotView />
    </>
  );
}
