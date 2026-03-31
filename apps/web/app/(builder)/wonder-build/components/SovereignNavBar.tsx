'use client';

import { useSovereignOS, type ActivePanel } from '../context/SovereignOSContext';

const TAB_CONFIG: { id: ActivePanel; label: string; icon: string }[] = [
  { id: 'ai-builder', label: 'AI Builder',    icon: '✨' },
  { id: 'editor',     label: 'Cloud Sandbox', icon: '☁️' },
  { id: 'playground', label: 'Live Preview',  icon: '▶' },
];

export function SovereignNavBar() {
  const {
    activePanel, setActivePanel,
    playgroundPlaying, togglePlayground,
    running, result,
  } = useSovereignOS();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-between border-b border-white/10 bg-black/90 px-3 backdrop-blur">

      {/* Left: Brand */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-bold tracking-widest uppercase text-violet-400 shrink-0">
          Sovereign<span className="text-white">_OS</span>
        </span>
        <span className="hidden sm:block h-3 w-px bg-white/20" />
        <span className="hidden sm:block text-[10px] text-white/30 font-mono truncate">
          WebGLStudio · PlayCanvas Engine
        </span>
        {running && (
          <span className="flex items-center gap-1 rounded-full bg-violet-600/20 border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Building…
          </span>
        )}
        {result && !running && (
          <span className="rounded-full bg-green-600/20 border border-green-500/30 px-2 py-0.5 text-[10px] text-green-300">
            ✓ {(result.code.length / 1024).toFixed(1)} KB ready
          </span>
        )}
      </div>

      {/* Center: Tabs */}
      <nav className="absolute inset-x-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                activePanel === tab.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Play/Pause 3D */}
        <button
          onClick={togglePlayground}
          title={playgroundPlaying ? 'Pause 3D scene' : 'Play 3D scene'}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            playgroundPlaying
              ? 'border-green-500/40 bg-green-500/10 text-green-300'
              : 'border-white/15 bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          {playgroundPlaying ? '⏸' : '▶'} 3D
        </button>

        {/* Supabase status */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-white/40 font-mono">Supabase</span>
        </div>

        {/* BYOC key indicator */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] text-white/40 font-mono">BYOC</span>
        </div>
      </div>
    </header>
  );
}
