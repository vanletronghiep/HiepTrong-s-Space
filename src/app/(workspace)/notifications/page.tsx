import type { Metadata } from 'next';
import { NotificationsHubView } from '@/features/notifications/NotificationsHubView';
import { PageReady } from '@/features/transitions/TransitionProvider';

export const metadata: Metadata = {
  title: 'Notifications',
};

export default function NotificationsPage() {
  return (
    <>
      <PageReady />
      <NotificationsHubView />
    </>
  );
}

