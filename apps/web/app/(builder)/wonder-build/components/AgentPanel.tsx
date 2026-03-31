'use client';

import { useRef, useEffect, useState } from 'react';
import { useSovereignOS, STAGE_ORDER, STAGE_INFO, type BuildType } from '../context/SovereignOSContext';
import { ConfessionsDrawer } from './ConfessionsDrawer';

const TYPE_OPTIONS: { value: BuildType; icon: string; label: string }[] = [
  { value: 'website',   icon: '🌐', label: 'Website'   },
  { value: 'game',      icon: '🎮', label: 'Game'       },
  { value: 'component', icon: '🧩', label: 'Component'  },
  { value: 'playcanvas',icon: '🎯', label: 'PlayCanvas' },
];

const EXAMPLES: Record<BuildType, string> = {
  website:    'A dark sci-fi portfolio with animated hero',
  game:       'A neon snake game with increasing speed',
  component:  'An animated pricing table with yearly toggle',
  playcanvas: 'A rotating 3D robot with idle animation',
};

export function AgentPanel() {
  const {
    buildType, setBuildType,
    prompt, setPrompt,
    agents, agentLog,
    result, error, running,
    runBuild, stopBuild,
    setActivePanel,
    confessions,
  } = useSovereignOS();

  const logBottomRef = useRef<HTMLDivElement>(null);
  const [showConfessions, setShowConfessions] = useState(false);

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLog.length]);

  const hasActivity = agentLog.length > 0;

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-white/10 bg-black/60">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400">AI Builder</p>
        <p className="mt-0.5 text-[10px] text-white/30">Describe → Agents build → Code streams into editor</p>
      </div>

      {/* Build type selector */}
      <div className="shrink-0 grid grid-cols-2 gap-1.5 p-3">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBuildType(opt.value)}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
              buildType === opt.value
                ? 'border-violet-500/50 bg-violet-500/10 text-violet-200'
                : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80'
            }`}
          >
            <span>{opt.icon}</span> {opt.label}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="shrink-0 px-3 pb-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runBuild(); }}
          placeholder={EXAMPLES[buildType]}
          rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
        />
        <p className="mt-1 text-right text-[10px] text-white/20">⌘↵ to build</p>
      </div>

      {/* Action button */}
      <div className="shrink-0 px-3 pb-3">
        {!running ? (
          <button
            onClick={runBuild}
            disabled={!prompt.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✨ Build with AI
          </button>
        ) : (
          <button
            onClick={stopBuild}
            className="w-full rounded-xl border border-red-500/30 bg-red-600/10 py-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-600/20"
          >
            ⏹ Stop
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="shrink-0 border-t border-white/10 px-4 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Agent Activity</p>
      </div>

      {/* Stage status */}
      <div className="shrink-0 flex flex-col gap-1.5 px-3 pb-2">
        {STAGE_ORDER.map((stage) => {
          const ev = agents[stage];
          const info = STAGE_INFO[stage];
          const status = ev?.status ?? 'idle';
          const isActive = status === 'running';
          const isDone = status === 'done';

          return (
            <div
              key={stage}
              className={`rounded-lg border p-2 transition-all ${
                isActive
                  ? 'border-violet-500/40 bg-violet-500/5'
                  : isDone
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-white/5 opacity-30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{info.icon}</span>
                <span className="text-[11px] font-semibold text-white/80">{info.label}</span>
                <div className="ml-auto">
                  {isActive && (
                    <span className="flex gap-[3px]">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                  {isDone && <span className="text-green-400 text-xs">✓</span>}
                </div>
              </div>
              {ev?.message && (
                <p className="mt-0.5 text-[10px] text-white/40 leading-relaxed line-clamp-2">
                  {ev.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable log */}
      <div className={`px-3 pb-3 space-y-1.5 overflow-y-auto ${showConfessions ? 'hidden' : 'min-h-0 flex-1'}`}>
        {!hasActivity && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="text-3xl opacity-30">🤖</span>
            <p className="text-[10px] text-white/20">No activity yet. Hit Build to start.</p>
          </div>
        )}
        {agentLog.map((ev, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">{STAGE_INFO[ev.stage]?.icon}</span>
              <span className={`text-[10px] font-semibold ${
                ev.status === 'done' ? 'text-green-400' : ev.status === 'error' ? 'text-red-400' : 'text-white/60'
              }`}>
                {ev.label}
              </span>
              <span className="ml-auto text-[9px] text-white/20 font-mono">
                {new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            {ev.message && (
              <p className="mt-0.5 text-[10px] text-white/30 leading-relaxed">{ev.message}</p>
            )}
          </div>
        ))}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5">
            <p className="text-[10px] font-semibold text-red-400">⚠ {error}</p>
          </div>
        )}
        {result && !running && (
          <button
            onClick={() => setActivePanel('playground')}
            className="w-full rounded-lg border border-green-500/30 bg-green-500/5 px-2.5 py-2 text-[10px] text-green-300 hover:bg-green-500/10 transition-colors text-left"
          >
            🎉 Build complete — click to view in Playground
          </button>
        )}
        <div ref={logBottomRef} />
      </div>

      {/* Confessions drawer (takes over lower half when open) */}
      {showConfessions && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ConfessionsDrawer
            confessions={confessions}
            open={showConfessions}
          />
        </div>
      )}

      {/* Confessions toggle bar — always visible at the bottom */}
      <div className="shrink-0 border-t border-white/10 bg-black/80 px-3 py-2">
        <button
          onClick={() => setShowConfessions((v) => !v)}
          className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-all ${
            showConfessions
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
              : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/70'
          }`}
        >
          <span className="text-base leading-none">🤫</span>
          <span>AI Confessions</span>
          {confessions.length > 0 && (
            <span className="ml-1 rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
              {confessions.length}
            </span>
          )}
          <span className="ml-auto text-[9px] text-white/20">read-only</span>
          <span className="text-[10px] text-white/30">{showConfessions ? '▲' : '▼'}</span>
        </button>
      </div>
    </aside>
  );
}
