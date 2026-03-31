/**
 * Builder Page - AI-WONDERLAND Main Interface
 * Loads the QuadEngineShell with all 4 engines
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const QuadEngineShell = dynamic(() => import('@/components/QuadEngineShell').then(mod => ({ default: mod.QuadEngineShell })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <p className="text-cyan-400 font-mono">Initializing AI-WONDERLAND...</p>
      </div>
    </div>
  ),
});

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-black" />}>
      <QuadEngineShell />
    </Suspense>
  );
}
