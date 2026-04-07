'use client';
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
        <div
          className={`h-full flex-1 ${
            activePanel === 'playground' ? 'flex flex-col' : 'hidden xl:flex xl:flex-col'
          }`}
        >
          <PlaygroundPanel />
        </div>
        {/* Right: Code view — smaller secondary panel */}
        <div
          className={`h-full flex-col ${
            activePanel === 'playground' ? 'hidden xl:flex' : 'flex'
          } xl:w-96 xl:shrink-0`}
        >
          <CloudSandboxPanel />
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
