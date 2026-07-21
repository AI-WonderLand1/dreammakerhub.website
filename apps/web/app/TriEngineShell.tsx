'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { logger } from '@/lib/logger';

type Engine = 'webgls' | '3d' | 'ui';

interface EngineConfig {
  id: Engine;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  hint: string;
  accentClass: string;
  accentBorder: string;
}

const WebGLStudioHost = dynamic(() => import('../components/WebGLStudioHost'), { ssr: false });
const PlayCanvasViewer = dynamic(() => import('../components/engines/PlayCanvasViewer'), { ssr: false });
const PuckUIEngine = dynamic(() => import('../components/engines/PuckUIEngine'), { ssr: false });

const ENGINES: EngineConfig[] = [
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

export function TriEngineShell() {
  const [active, setActive] = useState<Engine>('webgls');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [cmdLog, setCmdLog] = useState<{ text: string; type: 'user' | 'system' }[]>([]);
  const [engineStatus, setEngineStatus] = useState<Record<Engine, 'loading' | 'ready' | 'error'>>({
    webgls: 'loading',
    '3d': 'loading',
    ui: 'loading',
  });

  const activeEngine = ENGINES.find(e => e.id === active)!;

  function handleEngineReady(id: Engine) {
    setEngineStatus(prev => ({ ...prev, [id]: 'ready' }));
  }

  function handleEngineError(id: Engine) {
    setEngineStatus(prev => ({ ...prev, [id]: 'error' }));
  }

  function sendCommand() {
    if (!prompt.trim()) return;
    const text = prompt.trim();
    setCmdLog(prev => [...prev, { text, type: 'user' }]);
    setPrompt('');
    setCmdLog(prev => [...prev, { text: `Command sent to ${activeEngine.shortLabel}.`, type: 'system' }]);
  }

  function statusIndicator(id: Engine) {
    const s = engineStatus[id];
    if (s === 'ready') return 'bg-green-400';
    if (s === 'error') return 'bg-red-400';
    return 'bg-yellow-400 animate-pulse';
  }

  return (
    <div className="fixed inset-0 flex bg-[#0a0a0a] text-white overflow-hidden">

      {/* LEFT ICON RAIL */}
      <nav className="z-40 flex w-12 shrink-0 flex-col items-center border-r border-white/10 bg-black py-3 gap-1">
        <Link
          href="/"
          title="Homepage"
          className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white/70 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>

        <div className="w-7 h-px bg-white/10 mb-1" />

        {ENGINES.map(eng => (
          <button
            key={eng.id}
            onClick={() => setActive(eng.id)}
            title={eng.label}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              active === eng.id
                ? eng.accentBorder
                : 'border-transparent text-white/30 hover:border-white/20 hover:text-white/70'
            }`}
          >
            <span className={active === eng.id ? eng.accentClass : ''}>{eng.icon}</span>
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-black/95 px-2.5 py-1.5 text-[11px] text-white/70 shadow-xl group-hover:flex z-50">
              {eng.label}
            </span>
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setCmdOpen(v => !v)}
          title="AI Command Center"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
            cmdOpen
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
              : 'border-transparent text-white/30 hover:border-white/20 hover:text-white/70'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold tracking-wider ${activeEngine.accentClass}`}>
              {activeEngine.shortLabel}
            </span>
            <span className="hidden sm:block text-[10px] text-white/30">{activeEngine.hint}</span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${statusIndicator(active)}`} />
              <span className="text-[10px] text-white/25 capitalize">{engineStatus[active]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/wonder-build/puck" className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 transition-colors">
              Puck Editor
            </Link>
            <Link href="/wonder-build/playcanvas" className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 transition-colors">
              Full 3D
            </Link>
            <Link href="/" className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 transition-colors">
              Homepage
            </Link>
          </div>
        </header>

        {/* Engine panels — native components */}
        <div className="relative flex-1 overflow-hidden">

          {/* WebGL Studio */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === 'webgls' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <WebGLStudioHost
              onReady={() => handleEngineReady('webgls')}
              onError={() => handleEngineError('webgls')}
            />
          </div>

          {/* PlayCanvas 3D */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === '3d' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <PlayCanvasViewer
              onSceneReady={() => handleEngineReady('3d')}
            />
          </div>

          {/* Puck UI Builder */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${active === 'ui' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <PuckUIEngine />
          </div>
        </div>
      </div>

      {/* AI COMMAND CENTER */}
      {cmdOpen && (
        <aside className="z-40 flex w-72 shrink-0 flex-col border-l border-white/10 bg-black/95 backdrop-blur">
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

          <div className="border-b border-white/10 px-4 py-3">
            <div className={`rounded-lg border px-3 py-2 ${activeEngine.accentBorder}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${activeEngine.accentClass}`}>Active target</p>
              <p className="mt-1 text-[11px] text-white/60 leading-relaxed">{activeEngine.hint}</p>
            </div>
          </div>

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
                {entry.type === 'user' && <span className="font-mono text-white/30 mr-1">&gt;</span>}
                {entry.text}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-3">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendCommand(); }}
              placeholder={
                active === 'webgls'
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
              Send to {activeEngine.shortLabel}
            </button>
            <p className="mt-1 text-center text-[9px] text-white/20">Ctrl+Enter to send</p>
          </div>
        </aside>
      )}
    </div>
  );
}
