"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CLIENT_PERSONAS } from '@/lib/ai/personas';
import { useFeatureGate } from '@/lib/useSubscription';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string };
type Point = { x: number; y: number };
type Drag = { target: 'button' | 'panel'; px: number; py: number; x: number; y: number } | null;

type UniversalAIProps = {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'dark' | 'light';
  enableAgents?: boolean;
  enableRunners?: boolean;
  defaultAgent?: string;
  dashboardUrl?: string;
};

const MODELS = CLIENT_PERSONAS.map((p) => ({ id: p.id, name: p.name, sub: p.tagline, tier: p.tier }));
const PANEL_W = 420;
const PANEL_H = 620;
const EDGE = 12;
const STORAGE = 'dreammakerhub-ai-position-v3';

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), Math.max(min, max));
}

function clampPoint(point: Point, width: number, height: number): Point {
  if (typeof window === 'undefined') return point;
  return {
    x: clamp(point.x, EDGE, window.innerWidth - Math.min(width, window.innerWidth - EDGE * 2) - EDGE),
    y: clamp(point.y, EDGE, window.innerHeight - Math.min(height, window.innerHeight - EDGE * 2) - EDGE),
  };
}

export default function UniversalAIAssistant({
  position = 'bottom-right', theme = 'dark', enableAgents = true, enableRunners = true,
  defaultAgent = 'spirit-guide', dashboardUrl = '/dashboard',
}: UniversalAIProps) {
  void theme; void enableRunners;
  const pathname = usePathname();
  const { isPaid } = useFeatureGate('agents');
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState('alice');
  const [agent, setAgent] = useState(defaultAgent);
  const [showModels, setShowModels] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [buttonPos, setButtonPos] = useState<Point>({ x: 20, y: 100 });
  const [panelPos, setPanelPos] = useState<Point>({ x: 20, y: 80 });
  const [drag, setDrag] = useState<Drag>(null);
  const moved = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const agentOptions = useMemo(() => [
    { id: 'spirit-guide', name: 'Assistant' },
    { id: 'egyptian_voice', name: 'Voice' },
    ...(isPaid && enableAgents ? [
      { id: 'builder', name: 'Builder' }, { id: 'designer', name: 'Designer' }, { id: 'debugger', name: 'Debugger' },
    ] : []),
  ], [enableAgents, isPaid]);

  useEffect(() => {
    const right = Math.max(EDGE, window.innerWidth - 64);
    const bottom = Math.max(80, window.innerHeight - 72);
    const fallback = pathname.startsWith('/wonder-build') ? { x: 20, y: bottom } : {
      x: position.includes('right') ? right : 20,
      y: position.includes('top') ? 88 : bottom,
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      const button = saved?.button ? clampPoint(saved.button, 52, 52) : fallback;
      const panel = saved?.panel ? clampPoint(saved.panel, PANEL_W, PANEL_H) : clampPoint({ x: button.x - PANEL_W + 52, y: button.y - PANEL_H + 52 }, PANEL_W, PANEL_H);
      setButtonPos(button); setPanelPos(panel);
    } catch {
      setButtonPos(fallback); setPanelPos(clampPoint({ x: fallback.x, y: 80 }, PANEL_W, PANEL_H));
    }
  }, [pathname, position]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify({ button: buttonPos, panel: panelPos })); } catch {}
  }, [buttonPos, panelPos]);

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      const dx = event.clientX - drag.px; const dy = event.clientY - drag.py;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
      if (drag.target === 'button') setButtonPos(clampPoint({ x: drag.x + dx, y: drag.y + dy }, 52, 52));
      else setPanelPos(clampPoint({ x: drag.x + dx, y: drag.y + dy }, PANEL_W, PANEL_H));
    };
    const up = () => { setDrag(null); setTimeout(() => { moved.current = false; }, 0); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const startDrag = (target: 'button' | 'panel', event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const p = target === 'button' ? buttonPos : panelPos;
    moved.current = false;
    setDrag({ target, px: event.clientX, py: event.clientY, x: p.x, y: p.y });
  };

  const send = useCallback(async () => {
    const prompt = input.trim(); if (!prompt || loading) return;
    setMessages((m) => [...m, { id: `${Date.now()}u`, role: 'user', content: prompt }]); setInput(''); setLoading(true);
    try {
      const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-12).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const normalChat = agent === 'spirit-guide' || agent === 'egyptian_voice';
      const response = normalChat
        ? await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId, message: prompt, history }) })
        : await fetch('/api/unified-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'agent', agent, message: prompt, context: { page: pathname }, history }) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 402 || data.upgrade) throw new Error(`${data.label || 'This AI feature'} requires a paid plan.`);
      if (!response.ok || data.error) throw new Error(data.error || `AI request failed (${response.status})`);
      const text = normalChat ? data.text : (data.response || data.answer || data.code || data.result || data.glimpse);
      if (typeof text !== 'string' || !text.trim()) throw new Error('The AI returned no usable response. Nothing was marked complete.');
      setMessages((m) => [...m, { id: `${Date.now()}a`, role: 'assistant', content: text.trim() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed';
      setMessages((m) => [...m, { id: `${Date.now()}e`, role: 'assistant', content: `Error: ${message}` }]);
    } finally { setLoading(false); }
  }, [agent, input, loading, messages, modelId, pathname]);

  return <>
    {!open && <button type="button" onPointerDown={(e) => startDrag('button', e)} onClick={() => { if (!moved.current) setOpen(true); }} style={{ left: buttonPos.x, top: buttonPos.y }} className="fixed z-[80] grid h-[52px] w-[52px] touch-none select-none place-items-center rounded-2xl border border-white/15 bg-[#111827]/95 text-xl font-black text-white shadow-2xl backdrop-blur hover:border-violet-400/40" aria-label="Open or drag AI Assistant" title="Drag me anywhere">✦</button>}

    {open && <section style={{ left: panelPos.x, top: panelPos.y, width: `min(${PANEL_W}px, calc(100vw - 24px))`, height: `min(${PANEL_H}px, calc(100vh - 24px))` }} className="fixed z-[90] flex max-h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] text-white shadow-[0_24px_90px_rgba(0,0,0,.7)]">
      <div onPointerDown={(e) => startDrag('panel', e)} className="flex cursor-move touch-none select-none items-center justify-between border-b border-white/10 bg-white/[.03] px-4 py-3" title="Drag this bar to move the assistant">
        <div><h3 className="text-base font-extrabold">AI Assistant</h3><p className="text-xs font-bold text-white/50">Drag anywhere • real AI responses</p></div>
        <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => setShowModels((v) => !v)} className="rounded-lg border border-white/10 px-2 py-1 text-xs font-bold text-white/70">Model</button>
          {enableAgents && <button onClick={() => setShowAgents((v) => !v)} className="rounded-lg border border-white/10 px-2 py-1 text-xs font-bold text-white/70">Agent</button>}
          <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-xl font-bold text-white/60 hover:bg-white/5">×</button>
        </div>
      </div>

      {showModels && <div className="max-h-44 overflow-y-auto border-b border-white/10 bg-[#101014] p-2">{MODELS.map((model) => { const locked = model.tier === 'premium' && !isPaid; return <button key={model.id} disabled={locked} onClick={() => { setModelId(model.id); setShowModels(false); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/5 disabled:opacity-30"><span className="block text-sm font-extrabold">{model.name}{locked ? ' • Pro' : ''}</span><span className="block text-xs font-semibold text-white/45">{model.sub}</span></button>; })}</div>}

      {showAgents && <div className="flex flex-wrap gap-2 border-b border-white/10 bg-[#101014] p-3">{agentOptions.map((item) => <button key={item.id} onClick={() => { setAgent(item.id); setShowAgents(false); }} className={`rounded-lg border px-3 py-2 text-xs font-extrabold ${agent === item.id ? 'border-violet-400/30 bg-violet-500/15' : 'border-white/10 text-white/65'}`}>{item.name}</button>)}{!isPaid && <Link href="/subscription" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/45">Unlock Builder agents</Link>}</div>}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-center"><p className="text-base font-extrabold">Ask me anything.</p><p className="mt-1 text-sm font-semibold leading-6 text-white/60">I will return the real result or a real error. No fake “done” or placeholder success replies.</p></div>}
        {messages.map((m) => <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl border px-4 py-3 text-[15px] font-semibold leading-6 ${m.role === 'user' ? 'border-violet-400/20 bg-violet-500/15' : 'border-white/10 bg-white/[.045] text-white/90'}`}><p className="whitespace-pre-wrap">{m.content}</p></div></div>)}
        {loading && <div className="w-fit rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-extrabold text-white/60">Thinking…</div>}<div ref={endRef} />
      </div>

      <div className="border-t border-white/10 bg-[#0c0c10] p-3"><div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[.035] p-2 focus-within:border-violet-400/35"><textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={2} placeholder="Ask anything…" className="min-h-[52px] flex-1 resize-none bg-transparent px-2 py-1 text-[15px] font-semibold leading-6 text-white outline-none placeholder:text-white/35" /><button type="button" onClick={() => void send()} disabled={!input.trim() || loading} className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-sm font-extrabold disabled:opacity-35">Send</button></div><div className="mt-2 flex gap-2 text-xs font-bold text-white/40"><button onClick={() => setInput('Help me build this project')} className="rounded px-2 py-1 hover:bg-white/5">Build</button><button onClick={() => setInput('Help me debug this project')} className="rounded px-2 py-1 hover:bg-white/5">Debug</button><Link href={dashboardUrl} className="rounded px-2 py-1 hover:bg-white/5">Dashboard</Link></div></div>
    </section>}
  </>;
}

export { UniversalAIAssistant };
