'use client';
import { Suspense } from 'react';
import { SovereignOSProvider } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import { AgentPanel } from '../components/AgentPanel';
import { AutoStartFromURL } from '../components/AutoStartFromURL';
import { logger } from '@/lib/logger';

function AgentPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <AutoStartFromURL />
      <SovereignNavBar />
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '48px' }}>
        <div className="flex h-full w-full max-w-[32rem] min-w-[24rem] shrink-0">
          <AgentPanel />
        </div>
        <div className="hidden lg:flex h-full flex-1 items-center justify-center border-l border-white/5">
          <div className="text-center">
            <p className="text-5xl opacity-10">🎯</p>
            <p className="mt-4 text-sm font-semibold text-white/20">Wonderbuild</p>
            <p className="mt-1 text-xs text-white/15">
              Describe what you want and AI builds it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Wonderbuild...</div>}>
      <SovereignOSProvider>
        <AgentPage />
      </SovereignOSProvider>
    </Suspense>
  );
}
