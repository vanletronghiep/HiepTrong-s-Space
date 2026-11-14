import { notFound } from 'next/navigation';
import { EventsPilotPrototype } from '@/features/events/pilot/EventsPilotPrototype';
// This server page uses the runtime mode only to gate the development preview.
// eslint-disable-next-line no-restricted-imports
import { isDevelopment } from '@/server/config';

export default function EventsPilotPreviewPage() {
  if (!isDevelopment()) notFound();
  return <EventsPilotPrototype />;
}

