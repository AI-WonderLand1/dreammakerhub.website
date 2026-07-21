'use client';

import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';

// Dynamic client-only imports for accessibility components
const SpiritGuide = dynamic(
  () => import('@/components/SpiritGuide').then((m) => ({ default: m.SpiritGuide })),
  { ssr: false }
);

const VisualTranscript = dynamic(
  () => import('@/components/VisualTranscript').then((m) => ({ default: m.VisualTranscript })),
  { ssr: false }
);

export function ClientAccessibilityWrapper() {
  return (
    <>
      <VisualTranscript />
      <SpiritGuide />
    </>
  );
}
