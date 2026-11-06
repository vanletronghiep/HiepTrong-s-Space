import { notFound } from 'next/navigation';
import { HomeJourney } from '@/features/home/HomeJourney';
// This server page uses the runtime mode only to gate the development preview.
// eslint-disable-next-line no-restricted-imports
import { isDevelopment } from '@/server/config';

export default function HomeMotionPreview() {
  if (!isDevelopment()) notFound();
  return <HomeJourney preview />;
}
