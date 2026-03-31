'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Engine = 'code' | 'webgls' | '3d' | 'ui';

interface EngineConfig {
  id: Engine;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  hint: string;
  accentClass: string;
  accentBorder: string;
}

const ENGINES: EngineConfig[] = [
  {
    id: 'code',
    label: 'Code Editor',
    shortLabel: 'Theia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
    hint: 'Theia IDE · JavaScript · variables · logic',
    accentClass: 'text-green-400',
    accentBorder: 'border-green-500/50 bg-green-500/10',
  },
  {
    id: 'webgls',
    label: 'Shader / Asset Editor',
    shortLabel: 'WebGLS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 7l3 3-3 3M13 13h4"/>
      </svg>
    ),
    hint: 'GLSL shaders · materials · post-processing',
    accentClass: 'text-cyan-400',
    accentBorder: 'border-cyan-500/50 bg-cyan-500/10',
  },
  {
    id: '3d',
    label: 'Game / 3D Builder',
    shortLabel: 'PlayCanvas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    hint: 'PlayCanvas · scene JSON · entities · physics',
    accentClass: 'text-blue-400',
    accentBorder: 'border-blue-500/50 bg-blue-500/10',
  },
  {
    id: 'ui',
    label: 'UI / Page Builder',
    shortLabel: 'Puck',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
      </svg>
    ),
    hint: 'Puck · Shadon · React blocks · drag & drop',
    accentClass: 'text-violet-400',
    accentBorder: 'border-violet-500/50 bg-violet-500/10',
  },
];

const THEIA_SRC = '/wonderspace';
const WEBGLS_SRC = '/webglstudio/webglstudio.js-master/editor/index.html';
const PLAYCANVAS_SRC = '/wonder-build/playcanvas';
const PUCK_SRC = '/wonder-build/puck';

// Shared state for variables
interface SharedState {
  variables: Record<string, any>;
}

const initialSharedState: SharedState = {
  variables: {},
};

interface AIConfession {
  timestamp: number;
  confidence: number;
  confession: string;
  trustScore: number;
}

export function QuadEngineShell() {
  const [active, setActive] = useState<Engine>('code');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [cmdLog, setCmdLog] = useState<{ text: string; type: 'user' | 'system' }[]>([]);
  const [confessionsOpen, setConfessionsOpen] = useState(true);
  const [confessions, setConfessions] = useState<AIConfession[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<Record<Engine, 'loading' | 'ready' | 'error'>>({
    code: 'loading',
    webgls: 'loading',
    '3d': 'loading',
    ui: 'loading',
  });
  const [sharedState, setSharedState] = useState<SharedState>(initialSharedState);

  const theiaRef = useRef<HTMLIFrameElement>(null);
  const webglsRef = useRef<HTMLIFrameElement>(null);
  const pcRef = useRef<HTMLIFrameElement>(null);
  const puckRef = useRef<HTMLIFrameElement>(null);

  const activeEngine = ENGINES.find(e => e.id === active)!;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d) return;
      if (d.event === 'editor:ready' || d.type === 'bridge:ready') {
        if (d.source === 'webgls') setBridgeStatus(prev => ({ ...prev, webgls: 'ready' }));
        if (d.source === 'theia') setBridgeStatus(prev => ({ ...prev, code: 'ready' }));
      }
      // Handle shared state updates from Theia
      if (d.type === 'shared:update') {
        setSharedState(prev => ({ ...prev, variables: { ...prev.variables, ...d.variables } }));
        // Broadcast to other engines
        broadcastSharedState();
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const broadcastSharedState = () => {
    const message = { type: 'shared:state', state: sharedState };
    theiaRef.current?.contentWindow?.postMessage(message, '*');
    webglsRef.current?.contentWindow?.postMessage(message, '*');
    pcRef.current?.contentWindow?.postMessage(message, '*');
    puckRef.current?.contentWindow?.postMessage(message, '*');
  };

  useEffect(() => {
    broadcastSharedState();
  }, [sharedState]);

  function sendCommand() {
    if (!prompt.trim()) return;
    const text = prompt.trim();
    setCmdLog(prev => [...prev, { text, type: 'user' }]);
    setPrompt('');

    // Simulate AI response with confessions
    const aiConfidence = Math.floor(Math.random() * (95 - 60) + 60); // 60-95%
    const newConfession: AIConfession = {
      timestamp: Date.now(),
      confidence: aiConfidence,
      confession: `${active === 'code' ? 'Code Generation' : active === 'webgls' ? 'Shader Creation' : active === '3d' ? '3D Scene' : 'UI Layout'} - Confidence: ${aiConfidence}%. Internal note: Prioritized speed over exhaustive verification.`,
      trustScore: aiConfidence / 100,
    };
    setConfessions(prev => [newConfession, ...prev].slice(0, 8));

    if (active === 'code') {
      theiaRef.current?.contentWindow?.postMessage(
        { command: 'wonder:inject', code: text, type: 'code' },
        '*',
      );
      setCmdLog(prev => [...prev, { text: 'Sent code command to Theia.', type: 'system' }]);
    } else if (active === 'webgls') {
      webglsRef.current?.contentWindow?.postMessage(
        { command: 'wonder:inject', code: text, type: 'shader' },
        '*',
      );
      setCmdLog(prev => [...prev, { text: 'Sent GLSL/shader command to WebGL Studio.', type: 'system' }]);
    } else if (active === '3d') {
      pcRef.current?.contentWindow?.postMessage(
        { command: 'wonder:scene', json: text },
        'https://playcanvas.com',
      );
      setCmdLog(prev => [...prev, { text: 'Sent Scene JSON to PlayCanvas.', type: 'system' }]);
    } else if (active === 'ui') {
      puckRef.current?.contentWindow?.postMessage(
        { command: 'wonder:puck', json: text },
        '*',
      );
      setCmdLog(prev => [...prev, { text: 'Sent layout JSON to Puck UI Builder.', type: 'system' }]);
    }
  }

  function iframeStatus(id: Engine) {
    const s = bridgeStatus[id];
    if (s === 'ready') return 'bg-green-400';
    if (s === 'error') return 'bg-red-400';
    return 'bg-yellow-400 animate-pulse';
  }

  return (
    <div className="fixed inset-0 flex bg-[#0a0a0a] text-white overflow-hidden quad-engine-shell">

      {/* ── LEFT ICON RAIL ─────────────────────────────────────────────── */}
      <nav className="z-40 flex w-12 shrink-0 flex-col items-center border-r border-white/10 bg-black py-3 gap-1">
        {/* Home */}
        <Link
          href="/homepage"
          title="Homepage"
          className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white/70 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>

        <div className="w-7 h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50 mb-1" />

        {/* Engine tabs with tie-dye styling */}
        {ENGINES.map(eng => (
          <button
            key={eng.id}
            onClick={() => setActive(eng.id)}
            title={eng.label}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all engine-tab ${
              active === eng.id
                ? `${eng.accentBorder} tie-dye-shadow`
                : 'border-transparent text-white/30 hover:border-white/20 hover:text-white/70'
            }`}
          >
            <span className={active === eng.id ? eng.accentClass : ''}>{eng.icon}</span>
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-black/95 px-2.5 py-1.5 text-[11px] text-white/70 shadow-xl group-hover:flex z-50">
              {eng.label}
            </span>
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* AI Command toggle */}
        <button
          onClick={() => setCmdOpen(v => !v)}
          title="AI Command Center"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
            cmdOpen
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300 tie-dye-shadow'
              : 'border-transparent text-white/30 hover:border-white/20 hover:text-white/70'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </button>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Top bar with tie-dye accent */}
        <header className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur neon-header">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold tracking-wider tie-dye-text`}>
              {activeEngine.shortLabel}
            </span>
            <span className="hidden sm:block text-[10px] text-white/30">{activeEngine.hint}</span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${iframeStatus(active)}`} />
              <span className="text-[10px] text-white/25 capitalize">{bridgeStatus[active]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/wonder-build/puck" className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 transition-colors">
              Puck Editor
            </Link>
            <Link href="/unreal-wonder-build" className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 transition-colors">
              Full 3D
            </Link>
            <Link href="/homepage" className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 transition-colors">
              Homepage
            </Link>
          </div>
        </header>

        {/* Engine panels — all mounted simultaneously, CSS shows/hides */}
        <div className="relative flex-1 overflow-hidden">

          {/* Theia Code Editor */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <iframe
              ref={theiaRef}
              src={THEIA_SRC}
              title="Theia Code Editor"
              className="h-full w-full border-0"
              allow="fullscreen; clipboard-read; clipboard-write"
              onLoad={() => setBridgeStatus(prev => ({ ...prev, code: 'ready' }))}
              onError={() => setBridgeStatus(prev => ({ ...prev, code: 'error' }))}
            />
          </div>

          {/* WebGL Studio */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === 'webgls' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <iframe
              ref={webglsRef}
              src={WEBGLS_SRC}
              title="WebGL Studio Editor"
              className="h-full w-full border-0"
              allow="fullscreen; clipboard-read; clipboard-write; xr-spatial-tracking"
              onLoad={() => setBridgeStatus(prev => ({ ...prev, webgls: 'ready' }))}
              onError={() => setBridgeStatus(prev => ({ ...prev, webgls: 'error' }))}
            />
          </div>

          {/* PlayCanvas 3D */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === '3d' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <iframe
              ref={pcRef}
              src={PLAYCANVAS_SRC}
              title="PlayCanvas 3D Editor"
              className="h-full w-full border-0"
              allow="fullscreen; clipboard-read; clipboard-write; xr-spatial-tracking"
              onLoad={() => setBridgeStatus(prev => ({ ...prev, '3d': 'ready' }))}
              onError={() => setBridgeStatus(prev => ({ ...prev, '3d': 'error' }))}
            />
          </div>

          {/* Puck UI Builder */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === 'ui' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <iframe
              ref={puckRef}
              src={PUCK_SRC}
              title="Puck UI Builder"
              className="h-full w-full border-0"
              allow="fullscreen; clipboard-read; clipboard-write"
              onLoad={() => setBridgeStatus(prev => ({ ...prev, ui: 'ready' }))}
              onError={() => setBridgeStatus(prev => ({ ...prev, ui: 'error' }))}
            />
          </div>
        </div>
      </div>

      {/* ── AI COMMAND CENTER (right drawer) ───────────────────────────── */}
      {cmdOpen && (
        <aside className="z-40 flex w-72 shrink-0 flex-col border-l border-white/10 bg-black/95 backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400">AI Command</p>
              <p className="mt-0.5 text-[10px] text-white/30">
                Target: <span className={activeEngine.accentClass}>{activeEngine.shortLabel}</span>
              </p>
            </div>
            <button
              onClick={() => setCmdOpen(false)}
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* What the AI will do */}
          <div className="border-b border-white/10 px-4 py-3">
            <div className={`rounded-lg border px-3 py-2 ${activeEngine.accentBorder}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${activeEngine.accentClass}`}>Active target</p>
              <p className="mt-1 text-[11px] text-white/60 leading-relaxed">{activeEngine.hint}</p>
            </div>
          </div>

          {/* Log */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {cmdLog.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center opacity-40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-white/30">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                <p className="text-[10px] text-white/30">
                  Type a command below.<br/>It sends directly to {activeEngine.shortLabel}.
                </p>
              </div>
            )}
            {cmdLog.map((entry, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-[11px] leading-relaxed ${
                  entry.type === 'user'
                    ? 'border border-white/10 bg-white/[0.04] text-white/80'
                    : 'border border-green-500/20 bg-green-500/5 text-green-300'
                }`}
              >
                {entry.type === 'user' && <span className="font-mono text-white/30 mr-1">›</span>}
                {entry.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendCommand(); }}
              placeholder={
                active === 'code'
                  ? 'e.g. "Add a variable for cube size"'
                  : active === 'webgls'
                  ? 'e.g. "Add chromatic aberration post-process"'
                  : active === '3d'
                  ? 'e.g. "Spawn a neon city with point lights"'
                  : 'e.g. "Build a hero section with gradient CTA"'
              }
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
            <button
              onClick={sendCommand}
              disabled={!prompt.trim()}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Send to {activeEngine.shortLabel} ↵
            </button>
            <p className="mt-1 text-center text-[9px] text-white/20">⌘↵ to send</p>
          </div>
        </aside>
      )}

      {/* ── AI CONFESSIONS WINDOW (bottom-right overlay) ───────────────── */}
      {confessionsOpen && (
        <div className="fixed bottom-6 right-6 w-80 max-h-96 z-30 pointer-events-none">
          <div className="tie-dye-border rounded-2xl bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse" />
                <p className="text-[10px] font-mono uppercase tracking-widest tie-dye-text">AI Confessions</p>
              </div>
              <button
                onClick={() => setConfessionsOpen(false)}
                className="text-white/50 hover:text-white/80 transition-colors cursor-pointer pointer-events-auto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Confessions Log */}
            <div className="space-y-2 overflow-y-auto max-h-80">
              {confessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                  <p className="text-[9px] text-white/40">
                    AI transparency layer.<br/>Send commands to reveal confessions.
                  </p>
                </div>
              ) : (
                confessions.map((confession, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-[9px] leading-relaxed backdrop-blur"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/60 font-mono">
                        Confidence: <span className="tie-dye-text font-bold">{confession.confidence}%</span>
                      </span>
                      <span className="text-white/40 font-mono text-[8px]">
                        {new Date(confession.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white/50 italic leading-relaxed">"{confession.confession}"</p>
                    <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-transparent via-pink-500/40 via-purple-500/40 to-transparent" style={{ width: `${confession.trustScore * 100}%` }} />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <p className="text-[8px] uppercase tracking-widest text-white/30">
                Non-interactive transparency layer • Real-time AI reasoning
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confessions toggle (fixed bottom-left) */}
      {!confessionsOpen && (
        <button
          onClick={() => setConfessionsOpen(true)}
          className="fixed bottom-6 left-6 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/80 transition-all cursor-pointer pointer-events-auto hover:bg-white/10"
          title="Show AI Confessions"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </button>
      )}
    </div>
  );
}