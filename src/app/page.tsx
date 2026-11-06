import { HomeJourney } from '@/features/home/HomeJourney';
import { PageReady } from '@/features/transitions/TransitionProvider';

export default function HomePage() {
  return (
    <>
      <PageReady />
      <HomeJourney />
    </>
  );
}
