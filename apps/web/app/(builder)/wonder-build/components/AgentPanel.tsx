'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSovereignOS, STAGE_ORDER, STAGE_INFO, type BuildType } from '../context/SovereignOSContext';
import { htmlToPuckBlocks, storePuckData } from '@/lib/ai-to-puck';

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

  const router = useRouter();
  const logBottomRef = useRef<HTMLDivElement>(null);
  const latestConfessionIndex = useRef(confessions.length);
  const [activeLogTab, setActiveLogTab] = useState<'log' | 'confessions'>('log');
  const [expandedConfessions, setExpandedConfessions] = useState<Set<number>>(new Set());
  const [showConfessionPopup, setShowConfessionPopup] = useState(false);

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLog.length, confessions.length, activeLogTab]);

  useEffect(() => {
    if (confessions.length > latestConfessionIndex.current) {
      latestConfessionIndex.current = confessions.length;
      if (activeLogTab !== 'confessions') {
        setShowConfessionPopup(true);
        const timeout = window.setTimeout(() => setShowConfessionPopup(false), 4500);
        return () => window.clearTimeout(timeout);
      }
    }
  }, [confessions.length, activeLogTab]);

  const toggleConfession = useCallback((idx: number) => {
    setExpandedConfessions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const acceptToPuck = useCallback(() => {
    if (!result?.code) return;
    const puckData = htmlToPuckBlocks(result.code);
    const dataKey = storePuckData(puckData);
    router.push(`/wonder-build/puck?ai_data=${dataKey}`);
  }, [result?.code, router]);

  const hasActivity = agentLog.length > 0;
  const latestConfession = confessions[confessions.length - 1];

  return (
    <aside className="relative flex h-full flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0d]">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400">AI Builder</p>
        <p className="mt-0.5 text-[10px] text-white/30">Describe → Agents build → Code streams into editor</p>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5">
          <span className="truncate text-[10px] text-white/40">Updating apps/web/src/pages/HomePage.jsx</span>
          <span className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${running ? 'bg-violet-500/20 text-violet-200' : 'bg-white/10 text-white/50'}`}>
            {running ? 'Working' : 'Idle'}
          </span>
        </div>
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

      {showConfessionPopup && latestConfession && (
        <div className="pointer-events-none absolute left-1/2 top-[15.5rem] z-20 w-[calc(100%-1.5rem)] max-w-[18rem] -translate-x-1/2 rounded-3xl border border-violet-500/30 bg-slate-950/95 p-3 shadow-2xl shadow-violet-900/40 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">💬</span>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300">AI Confession</p>
                  <p className="mt-1 text-[11px] text-white/80 font-medium">Internal reasoning just arrived.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLogTab('confessions');
                    setShowConfessionPopup(false);
                  }}
                  className="pointer-events-auto rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/10"
                >
                  View
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/70 line-clamp-3">{latestConfession.text}</p>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex flex-1 flex-col px-3 pb-3 overflow-hidden">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveLogTab('log')}
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${
              activeLogTab === 'log'
                ? 'bg-white/10 text-white'
                : 'bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Agent Log
          </button>
          <button
            onClick={() => setActiveLogTab('confessions')}
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${
              activeLogTab === 'confessions'
                ? 'bg-violet-500/10 text-violet-100'
                : 'bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            AI Confessions
            {confessions.length > 0 && (
              <span className="ml-2 rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
                {confessions.length}
              </span>
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5">
          {activeLogTab === 'log' ? (
            <>
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
                <div className="space-y-2">
                  <button
                    onClick={() => setActivePanel('playground')}
                    className="w-full rounded-lg border border-green-500/30 bg-green-500/5 px-2.5 py-2 text-[10px] text-green-300 hover:bg-green-500/10 transition-colors"
                  >
                    🎉 Build complete — view preview
                  </button>
                  <button
                    onClick={acceptToPuck}
                    className="w-full rounded-lg bg-emerald-600 px-2.5 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-500"
                  >
                    ✨ Accept to Puck
                  </button>
                </div>
              )}
              <div ref={logBottomRef} />
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
              {confessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <span className="text-3xl opacity-20">🤫</span>
                  <p className="text-[10px] text-white/20">
                    No confessions yet. Build with AI and their internal reasoning will appear here.
                  </p>
                </div>
              ) : (
                confessions.map((c, i) => {
                  const hasTransparency = c.truth || c.what || c.why || c.how;
                  const isExpanded = expandedConfessions.has(i);

                  return (
                    <div key={i} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-violet-400 shrink-0 mt-0.5">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-white/70">{c.label}</span>
                            {c.workerId && (
                              <span className="rounded border border-white/10 bg-white/5 px-1 text-[9px] text-white/30 font-mono">
                                Worker {c.workerId}
                              </span>
                            )}
                            {c.type && (
                              <span className="rounded border border-violet-500/25 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
                                {c.type}
                              </span>
                            )}
                            {c.constitutionalCheck && (
                              <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/40">
                                {c.constitutionalCheck}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/25 mt-0.5 font-mono">
                            {new Date(c.at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-white/60 leading-relaxed rounded-lg bg-white/[0.03] border border-white/5 p-2 font-mono">
                        {c.text}
                      </p>

                      {hasTransparency && (
                        <button
                          onClick={() => toggleConfession(i)}
                          className="mt-2 text-[10px] text-violet-400 hover:text-violet-300"
                        >
                          {isExpanded ? '▼ Hide details' : '▶ Show truth / why / how'}
                        </button>
                      )}

                      {isExpanded && hasTransparency && (
                        <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                          {c.truth && (
                            <div className="flex gap-2 text-[10px] text-white/60">
                              <span className="font-bold text-green-400 w-14">TRUTH:</span>
                              <span>{c.truth}</span>
                            </div>
                          )}
                          {c.what && (
                            <div className="flex gap-2 text-[10px] text-white/60">
                              <span className="font-bold text-blue-400 w-14">WHAT:</span>
                              <span>{c.what}</span>
                            </div>
                          )}
                          {c.why && (
                            <div className="flex gap-2 text-[10px] text-white/60">
                              <span className="font-bold text-yellow-400 w-14">WHY:</span>
                              <span>{c.why}</span>
                            </div>
                          )}
                          {c.how && (
                            <div className="flex gap-2 text-[10px] text-white/60">
                              <span className="font-bold text-purple-400 w-14">HOW:</span>
                              <span>{c.how}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {c.trustScore != null && (
                        <div className="flex items-center gap-2 mt-2 select-none pointer-events-none">
                          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.trustScore >= 0.8 ? 'bg-green-500' : c.trustScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.round(Math.min(100, Math.max(0, c.trustScore * 100)))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40 font-mono shrink-0">
                            {Math.round(Math.min(100, Math.max(0, c.trustScore * 100)))}% trust
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logBottomRef} />
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-2">
          <button type="button" className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10" title="Attach image">
            🖼️
          </button>
          <button type="button" className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10" title="Voice input">
            🎤
          </button>
          <span className="min-w-0 flex-1 truncate text-[11px] text-white/40">Ask for changes…</span>
          {running && (
            <button
              type="button"
              onClick={stopBuild}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/20"
              title="Stop"
            >
              ⏹
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
