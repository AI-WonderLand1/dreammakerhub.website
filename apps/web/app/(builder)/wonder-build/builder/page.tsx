'use client';

import { useState, Suspense } from 'react';
import { SovereignOSProvider } from '../context/SovereignOSContext';
import { SovereignNavBar } from '../components/SovereignNavBar';
import { CloudSandboxPanel } from '../components/CloudSandboxPanel';
import { PlaygroundPanel } from '../components/PlaygroundPanel';
import { logger } from '@/lib/logger';

type BuilderTab = 'code' | 'preview';

export default function BuilderPage() {
  const [tab, setTab] = useState<BuilderTab>('code');

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Builder...</div>}>
      <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <a href="/wonder-build" className="text-xs text-white/40 hover:text-white transition-colors">← Hub</a>
            <span className="text-white/20">/</span>
            <span className="text-xs font-semibold text-white/80">Builder</span>
          </div>
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setTab('code')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'code' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              💻 Code
            </button>
            <button
              onClick={() => setTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'preview' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              👁️ Preview
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <SovereignOSProvider>
            <SovereignNavBar />
            <div className="h-full" style={{ paddingTop: '48px' }}>
              {tab === 'code' && (
                <div className="h-full max-w-[48rem] mx-auto">
                  <CloudSandboxPanel />
                </div>
              )}
              {tab === 'preview' && (
                <PlaygroundPanel />
              )}
            </div>
          </SovereignOSProvider>
        </div>
      </div>
    </Suspense>
  );
}
