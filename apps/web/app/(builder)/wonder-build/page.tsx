'use client';
import { Suspense } from 'react';
import { SovereignOSProvider, useSovereignOS } from './context/SovereignOSContext';
import { SovereignNavBar } from './components/SovereignNavBar';
import { AgentPanel } from './components/AgentPanel';
import { CloudSandboxPanel } from './components/CloudSandboxPanel';
import { PlaygroundPanel } from './components/PlaygroundPanel';
import { AutoStartFromURL } from './components/AutoStartFromURL';

function SovereignOSShell() {
  const { activePanel } = useSovereignOS();
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      {/* Reads ?prompt=...&type=... from URL and auto-fires the build */}
      <AutoStartFromURL />
      {/* Fixed top nav — always visible */}
      <SovereignNavBar />
      {/* Content area below the 44px nav */}
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '44px' }}>
        {/* Left: AI Builder + Agent Logs — always visible */}
        <div className="flex h-full w-64 shrink-0 xl:w-72">
          <AgentPanel />
        </div>
        {/* Center: Live Preview — larger main panel */}
        <div className="h-full flex-1 flex flex-col">
          <PlaygroundPanel />
        </div>
        {/* Right: Code view — smaller secondary panel */}
        <div className="hidden xl:flex h-full flex-col xl:w-96 xl:shrink-0">
          <CloudSandboxPanel />
        </div>
      </div>
    </div>
  );
}

export default function WonderBuildPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Wonder Build...</div>}>
      <SovereignOSProvider>
        <SovereignOSShell />
      </SovereignOSProvider>
    </Suspense>
  );
}
