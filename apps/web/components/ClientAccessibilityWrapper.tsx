'use client';

import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';

const VisualTranscript = dynamic(
  () => import('@/components/VisualTranscript').then((m) => ({ default: m.VisualTranscript })),
  { ssr: false }
);

export function ClientAccessibilityWrapper() {
  return (
    <>
      <VisualTranscript />
    </>
  );
}
