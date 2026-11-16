import type { Metadata } from 'next';
import { PageReady } from '@/features/transitions/TransitionProvider';
import { ZodiacIlluminationPreview } from './ZodiacIlluminationPreview';

export const metadata: Metadata = {
  title: 'Aquarius Illumination Preview',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ZodiacIlluminationPreviewPage() {
  return (
    <>
      <PageReady />
      <ZodiacIlluminationPreview />
    </>
  );
}
