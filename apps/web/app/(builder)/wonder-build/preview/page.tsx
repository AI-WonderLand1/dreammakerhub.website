'use client';
import { Suspense } from 'react';
import { SovereignOSProvider } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import { PlaygroundPanel } from '../components/PlaygroundPanel';

function PreviewPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <SovereignNavBar />
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '48px' }}>
        <div className="h-full w-full">
          <PlaygroundPanel />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Preview...</div>}>
      <SovereignOSProvider>
        <PreviewPage />
      </SovereignOSProvider>
    </Suspense>
  );
}
