'use client';

import dynamic from 'next/dynamic';

// Dynamic client-only imports for accessibility components
const AccessibilityOracle = dynamic(
  () => import('@/components/AccessibilityOracle').then((m) => ({ default: m.AccessibilityOracle })),
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
      <AccessibilityOracle />
    </>
  );
}
