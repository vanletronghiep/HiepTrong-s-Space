import { notFound } from 'next/navigation';
import { PageReady } from '@/features/transitions/TransitionProvider';
// This server page uses the runtime mode only to gate the development preview.
// eslint-disable-next-line no-restricted-imports
import { isDevelopment } from '@/server/config';
import { HomepagePilotPrototype } from './HomepagePilotPrototype';

export default function HomepagePilotPreviewPage() {
  if (!isDevelopment()) notFound();
  return (
    <>
      <PageReady />
      <HomepagePilotPrototype />
    </>
  );
}
