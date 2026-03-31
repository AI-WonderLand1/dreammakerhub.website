'use client';

import { SovereignOSProvider, useSovereignOS } from './context/SovereignOSContext';
import { SovereignNavBar } from './components/SovereignNavBar';
import { AgentPanel } from './components/AgentPanel';
import { CloudSandboxPanel } from './components/CloudSandboxPanel';
import { PlaygroundPanel } from './components/PlaygroundPanel';

function SovereignOSShell() {
  const { activePanel } = useSovereignOS();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      {/* Fixed top nav — always visible */}
      <SovereignNavBar />

      {/* Content area below the 44px nav */}
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '44px' }}>

        {/* Left: AI Builder + Agent Logs — always visible */}
        <div className="flex h-full w-64 shrink-0 xl:w-72">
          <AgentPanel />
        </div>

        {/* Center: Cloud Sandbox + Code View */}
        <div
          className={`h-full flex-1 ${
            activePanel === 'playground' ? 'hidden xl:flex xl:flex-col' : 'flex flex-col'
          }`}
        >
          <CloudSandboxPanel />
        </div>

        {/* Right: 3D Playground — always shown on xl, tab-controlled on smaller screens */}
        <div
          className={`h-full flex-col ${
            activePanel === 'playground'
              ? 'flex flex-1'
              : 'hidden xl:flex xl:w-80 xl:shrink-0'
          }`}
        >
          <PlaygroundPanel />
        </div>
      </div>
    </div>
  );
}

export default function WonderBuildPage() {
  return (
    <SovereignOSProvider>
      <SovereignOSShell />
    </SovereignOSProvider>
  );
}
