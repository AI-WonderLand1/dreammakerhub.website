"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CLIENT_PERSONAS } from '@/lib/ai/personas';
import { useFeatureGate } from '@/lib/useSubscription';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
type Point = { x: number; y: number };
type Drag = { target: 'button' | 'panel'; px: number; py: number; x: number; y: number } | null;
type Failure = { code: string; message: string } | null;
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
// Reset the legacy top-left saved position that covered whole-page content.
const STORAGE = 'dreammakerhub-ai-position-v4';

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), Math.max(min, max));
}

function clampPoint(point: Point, width: number, height: number): Point {
  if (typeof window === 'undefined') return point;
  const w = Math.min(width, Math.max(1, window.innerWidth - EDGE * 2));
  const h = Math.min(height, Math.max(1, window.innerHeight - EDGE * 2));
  return {
    x: clamp(point.x, EDGE, Math.max(EDGE, window.innerWidth - w - EDGE)),
    y: clamp(point.y, EDGE, Math.max(EDGE, window.innerHeight - h - EDGE)),
  };
}

export default function UniversalAIAssistant({
  position = 'bottom-right', theme = 'dark', enableAgents = true, enableRunners = true,
  defaultAgent = 'spirit-guide', dashboardUrl = '/dashboard',
}: UniversalAIProps) {
  void theme; void enableRunners;
  const pathname = usePathname();
  const { isPaid } = useFeatureGate('agents');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<Failure>(null);
  const [modelId, setModelId] = useState('alice');
  const [agent, setAgent] = useState(defaultAgent);
  const [showModels, setShowModels] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [buttonPos, setButtonPos] = useState<Point>({ x: EDGE, y: EDGE });
  const [panelPos, setPanelPos] = useState<Point>({ x: EDGE, y: EDGE });
  const [drag, setDrag] = useState<Drag>(null);
  const moved = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const agentOptions = useMemo(() => [
    { id: 'spirit-guide', name: 'Assistant' },
    ...(isPaid && enableAgents ? [
      { id: 'builder', name: 'Builder' },
      { id: 'designer', name: 'Designer' },
      { id: 'debugger', name: 'Debugger' },
    ] : []),
  ], [enableAgents, isPaid]);

  useEffect(() => {
    const button = clampPoint({
      x: position.includes('right') ? window.innerWidth - 64 : 20,
      y: position.includes('top') ? 88 : window.innerHeight - 72,
    }, 52, 52);
    const initialPanel = clampPoint({ x: button.x - PANEL_W + 52, y: button.y - PANEL_H + 52 }, PANEL_W, PANEL_H);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      setButtonPos(saved?.button ? clampPoint(saved.button, 52, 52) : button);
      setPanelPos(saved?.panel ? clampPoint(saved.panel, PANEL_W, PANEL_H) : initialPanel);
    } catch {
      setButtonPos(button);
      setPanelPos(initialPanel);
    }
    setMounted(true);
  }, [position]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STORAGE, JSON.stringify({ button: buttonPos, panel: panelPos })); } catch {}
  }, [buttonPos, mounted, panelPos]);

  useEffect(() => {
    if (!mounted) return;
    const resize = () => {
      setButtonPos((p) => clampPoint(p, 52, 52));
      setPanelPos((p) => clampPoint(p, PANEL_W, PANEL_H));
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [mounted]);

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      const dx = event.clientX - drag.px;
      const dy = event.clientY - drag.py;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
      if (drag.target === 'button') setButtonPos(clampPoint({ x: drag.x + dx, y: drag.y + dy }, 52, 52));
      else setPanelPos(clampPoint({ x: drag.x + dx, y: drag.y + dy }, PANEL_W, PANEL_H));
    };
    const up = () => { setDrag(null); setTimeout(() => { moved.current = false; }, 0); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading, open]);

  const startDrag = (target: 'button' | 'panel', event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const p = target === 'button' ? buttonPos : panelPos;
    moved.current = false;
    setDrag({ target, px: event.clientX, py: event.clientY, x: p.x, y: p.y });
  };

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setFailure(null);
    setMessages((current) => [...current, { id, role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const normalChat = agent === 'spirit-guide';
      const response = normalChat
        ? await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelId, message: prompt, history, context: { page: pathname } }),
          })
        : await fetch('/api/unified-ai', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'agent', agent, message: prompt, context: { page: pathname }, history }),
          });
      const data = await response.json().catch(() => ({}));
      if (response.status === 402 || data.upgrade) {
        throw { code: 'UPGRADE_REQUIRED', message: `${data.label || 'This AI feature'} requires a paid plan.` };
      }
      if (!response.ok || data.error) {
        throw { code: data.code || (response.status === 401 ? 'AUTH_REQUIRED' : 'REQUEST_FAILED'), message: data.error || `AI request failed (${response.status}).` };
      }
      const text = normalChat ? data.text : (data.response || data.answer || data.code || data.result || data.glimpse);
      if (typeof text !== 'string' || !text.trim()) throw { code: 'EMPTY_RESPONSE', message: 'The AI returned no usable response. No action was completed.' };
      setMessages((current) => [...current, { id: `${id}-response`, role: 'assistant', content: text.trim() }]);
    } catch (error) {
      const problem = error as { code?: string; message?: string };
      // A failed request is not part of the AI conversation or usage history.
      // Preserve the draft instead of making the user type their request twice.
      setMessages((current) => current.filter((message) => message.id !== id));
      setInput(prompt);
      setFailure({ code: problem.code || 'NETWORK_ERROR', message: problem.message || 'Unable to reach the assistant. Your message was not processed.' });
    } finally {
      setLoading(false);
    }
  }, [agent, input, loading, messages, modelId, pathname]);

  if (!mounted) return null;

  return <>
    {!open && <button type="button" onPointerDown={(event) => startDrag('button', event)} onClick={() => { if (!moved.current) setOpen(true); }} style={{ left: buttonPos.x, top: buttonPos.y }} className="fixed z-[80] grid h-[52px] w-[52px] touch-none select-none place-items-center rounded-2xl border border-white/20 bg-[#111827] text-xl font-black text-white shadow-2xl hover:border-violet-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400" aria-label="Open AI Assistant" title="Open or drag AI Assistant">✦</button>}

    {open && <section role="dialog" aria-label="AI Assistant" style={{ left: panelPos.x, top: panelPos.y, width: `min(${PANEL_W}px, calc(100vw - 24px))`, height: `min(${PANEL_H}px, calc(100dvh - 24px))` }} className="fixed z-[90] flex min-h-0 max-h-[calc(100dvh-24px)] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#09090b] text-white shadow-[0_24px_90px_rgba(0,0,0,.7)]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-white/[.04] px-3 py-3">
        <div onPointerDown={(event) => startDrag('panel', event)} className="min-w-0 flex-1 cursor-move touch-none select-none" title="Drag to move the assistant"><h3 className="text-sm font-bold">AI Assistant</h3><p className="truncate text-[11px] text-white/55">Help and project guidance</p></div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => { setShowModels((v) => !v); setShowAgents(false); }} aria-expanded={showModels} className="rounded-lg border border-white/15 px-2 py-1.5 text-xs font-semibold text-white/85">Model</button>
          {enableAgents && <button type="button" onClick={() => { setShowAgents((v) => !v); setShowModels(false); }} aria-expanded={showAgents} className="rounded-lg border border-white/15 px-2 py-1.5 text-xs font-semibold text-white/85">Agent</button>}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close AI Assistant" className="grid h-8 w-8 place-items-center rounded-lg text-xl text-white/75 hover:bg-white/10">×</button>
        </div>
      </header>

      {showModels && <div className="max-h-44 shrink-0 overflow-y-auto border-b border-white/10 bg-[#101014] p-2">{MODELS.map((model) => { const locked = model.tier === 'premium' && !isPaid; return <button type="button" key={model.id} disabled={locked} onClick={() => { setModelId(model.id); setShowModels(false); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/10 disabled:opacity-40"><span className="block text-sm font-bold">{model.name}{locked ? ' • Pro' : ''}{model.id === modelId ? ' ✓' : ''}</span><span className="block text-xs text-white/55">{model.sub}</span></button>; })}</div>}
      {showAgents && <div className="flex shrink-0 flex-wrap gap-2 border-b border-white/10 bg-[#101014] p-3">{agentOptions.map((item) => <button type="button" key={item.id} onClick={() => { setAgent(item.id); setShowAgents(false); }} className={`rounded-lg border px-3 py-2 text-xs font-bold ${agent === item.id ? 'border-violet-400/50 bg-violet-500/20' : 'border-white/15 text-white/75'}`}>{item.name}</button>)}{!isPaid && <Link href="/subscription" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70">Builder agent plans</Link>}</div>}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" aria-label="Conversation" aria-live="polite">
        {messages.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><p className="text-sm font-bold">How can I help?</p><p className="mt-1 text-sm leading-5 text-white/65">Ask about this page, your project, or an error. Project changes require an authorized agent; a chat answer does not edit files.</p></div>}
        {messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] break-words rounded-2xl border px-3 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'border-violet-400/30 bg-violet-500/20' : 'border-white/10 bg-white/[.06]'}`}><p className="whitespace-pre-wrap">{message.content}</p></div></div>)}
        {loading && <p className="w-fit rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-white/70" role="status">Waiting for AI response…</p>}
        <div ref={endRef} />
      </div>

      {failure && <div role="alert" className="shrink-0 border-t border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"><p className="break-words">{failure.message}</p><div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold underline underline-offset-2">{failure.code === 'AUTH_REQUIRED' && <Link href="/login">Sign in</Link>}{failure.code === 'UPGRADE_REQUIRED' && <Link href="/subscription">View plans</Link>}{failure.code === 'AI_NOT_CONFIGURED' && <Link href="/contact">Contact support</Link>}<button type="button" onClick={() => setFailure(null)}>Dismiss</button></div></div>}
      <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="shrink-0 border-t border-white/10 bg-[#0c0c10] p-3"><div className="flex min-w-0 items-end gap-2 rounded-xl border border-white/15 bg-white/[.045] p-2 focus-within:border-violet-400/60"><textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} rows={2} maxLength={10000} placeholder="Ask a question…" aria-label="Message the AI assistant" className="min-h-[48px] min-w-0 flex-1 resize-none bg-transparent px-1 py-1 text-sm leading-5 text-white outline-none placeholder:text-white/40" /><button type="submit" disabled={!input.trim() || loading} className="h-10 shrink-0 rounded-xl bg-violet-600 px-3 text-sm font-bold text-white disabled:opacity-40">Send</button></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/65"><button type="button" onClick={() => { setInput(`Help me understand this page: ${pathname}`); inputRef.current?.focus(); }} className="rounded px-1.5 py-1 hover:bg-white/10">This page</button><button type="button" onClick={() => { setInput('Help me troubleshoot an error: '); inputRef.current?.focus(); }} className="rounded px-1.5 py-1 hover:bg-white/10">Troubleshoot</button><Link href={dashboardUrl} className="rounded px-1.5 py-1 hover:bg-white/10">Dashboard</Link></div></form>
    </section>}
  </>;
}

export { UniversalAIAssistant };
