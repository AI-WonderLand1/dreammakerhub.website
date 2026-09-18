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
type Confession = {
  traceId: string;
  title: string;
  truth: string;
  what: string;
  why: string;
  how: string;
  detail?: string;
  createdAt: string;
  saved?: boolean;
};
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

function asConfession(value: unknown): Confession | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Confession>;
  if (typeof item.traceId !== 'string' || typeof item.truth !== 'string') return null;
  return {
    traceId: item.traceId,
    title: typeof item.title === 'string' ? item.title : 'Confession',
    truth: item.truth,
    what: typeof item.what === 'string' ? item.what : '',
    why: typeof item.why === 'string' ? item.why : '',
    how: typeof item.how === 'string' ? item.how : '',
    detail: typeof item.detail === 'string' ? item.detail : '',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
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
  const [tab, setTab] = useState<'chat' | 'confessions'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<Failure>(null);
  const [modelId, setModelId] = useState('alice');
  const [agent, setAgent] = useState(defaultAgent);
  const [showModels, setShowModels] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [sessionConfessions, setSessionConfessions] = useState<Confession[]>([]);
  const [savedConfessions, setSavedConfessions] = useState<Confession[]>([]);
  const [confessionsLoading, setConfessionsLoading] = useState(false);
  const [confessionsError, setConfessionsError] = useState<string | null>(null);
  const [confessionsRefresh, setConfessionsRefresh] = useState(0);
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

  const confessions = useMemo(() => {
    const byTrace = new Map<string, Confession>();
    sessionConfessions.forEach((item) => byTrace.set(item.traceId, item));
    savedConfessions.forEach((item) => byTrace.set(item.traceId, { ...byTrace.get(item.traceId), ...item, saved: true }));
    return Array.from(byTrace.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sessionConfessions, savedConfessions]);

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

  useEffect(() => { if (open && tab === 'chat') inputRef.current?.focus(); }, [open, tab]);
  useEffect(() => { if (open && tab === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading, open, tab]);

  useEffect(() => {
    if (!open || tab !== 'confessions') return;
    let cancelled = false;
    setConfessionsLoading(true);
    setConfessionsError(null);
    void (async () => {
      try {
        const response = await fetch('/api/ai/confessions?limit=50', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error?.message || 'Could not load saved confessions.');
        if (!cancelled) setSavedConfessions(Array.isArray(data.confessions)
          ? data.confessions.map(asConfession).filter((item: Confession | null): item is Confession => item !== null).map((item: Confession) => ({ ...item, saved: true }))
          : []);
      } catch (error) {
        if (!cancelled) setConfessionsError(error instanceof Error ? error.message : 'Could not load saved confessions.');
      } finally {
        if (!cancelled) setConfessionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, tab, confessionsRefresh]);

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
    setTab('chat');
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
      if (normalChat && Array.isArray(data.confessions)) {
        const entries = data.confessions.map(asConfession).filter((item: Confession | null): item is Confession => item !== null);
        setSessionConfessions((current) => [...entries.map((entry: Confession) => ({ ...entry, saved: data.confessionsStored === true })), ...current]);
        if (data.confessionsStored) setConfessionsRefresh((value) => value + 1);
      } else if (!normalChat) {
        setSessionConfessions((current) => [{
          traceId: id,
          title: 'Agent response',
          truth: 'The agent returned an AI-generated response. Its claims and any project changes have not been verified here.',
          what: `Requested an answer from the ${agent} agent.`,
          why: 'You sent a request to the agent.',
          how: 'The request was sent to /api/unified-ai. This chat does not verify downstream file operations.',
          createdAt: new Date().toISOString(),
          saved: false,
        }, ...current]);
      }
    } catch (error) {
      const problem = error as { code?: string; message?: string };
      setMessages((current) => current.filter((message) => message.id !== id));
      setInput(prompt);
      const message = problem.message || 'Unable to reach the assistant. Your message was not processed.';
      setFailure({ code: problem.code || 'NETWORK_ERROR', message });
      setSessionConfessions((current) => [{
        traceId: id,
        title: 'Failed assistant request',
        truth: message,
        what: 'No usable reply was received.',
        why: `The request failed (${problem.code || 'NETWORK_ERROR'}).`,
        how: 'The assistant reported the server or network error; no successful reply was confirmed.',
        createdAt: new Date().toISOString(),
        saved: false,
      }, ...current]);
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
      <div className="flex shrink-0 gap-1 border-b border-white/10 px-3 py-2" role="tablist" aria-label="Assistant views">
        <button type="button" role="tab" aria-selected={tab === 'chat'} onClick={() => setTab('chat')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === 'chat' ? 'bg-violet-500/25 text-white' : 'text-white/60 hover:bg-white/10'}`}>Chat</button>
        <button type="button" role="tab" aria-selected={tab === 'confessions'} onClick={() => { setTab('confessions'); setShowModels(false); setShowAgents(false); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === 'confessions' ? 'bg-violet-500/25 text-white' : 'text-white/60 hover:bg-white/10'}`}>Confessions{confessions.length ? ` (${confessions.length})` : ''}</button>
      </div>

      {showModels && tab === 'chat' && <div className="max-h-44 shrink-0 overflow-y-auto border-b border-white/10 bg-[#101014] p-2">{MODELS.map((model) => { const locked = model.tier === 'premium' && !isPaid; return <button type="button" key={model.id} disabled={locked} onClick={() => { setModelId(model.id); setShowModels(false); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/10 disabled:opacity-40"><span className="block text-sm font-bold">{model.name}{locked ? ' • Pro' : ''}{model.id === modelId ? ' ✓' : ''}</span><span className="block text-xs text-white/55">{model.sub}</span></button>; })}</div>}
      {showAgents && tab === 'chat' && <div className="flex shrink-0 flex-wrap gap-2 border-b border-white/10 bg-[#101014] p-3">{agentOptions.map((item) => <button type="button" key={item.id} onClick={() => { setAgent(item.id); setShowAgents(false); }} className={`rounded-lg border px-3 py-2 text-xs font-bold ${agent === item.id ? 'border-violet-400/50 bg-violet-500/20' : 'border-white/15 text-white/75'}`}>{item.name}</button>)}{!isPaid && <Link href="/subscription" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70">Builder agent plans</Link>}</div>}

      {tab === 'chat' ? <div role="tabpanel" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" aria-label="Conversation" aria-live="polite">
        {messages.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><p className="text-sm font-bold">How can I help?</p><p className="mt-1 text-sm leading-5 text-white/65">Ask about this page or an error. Chat answers do not edit files.</p></div>}
        {messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] break-words rounded-2xl border px-3 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'border-violet-400/30 bg-violet-500/20' : 'border-white/10 bg-white/[.06]'}`}><p className="whitespace-pre-wrap">{message.content}</p></div></div>)}
        {loading && <p className="w-fit rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-white/70" role="status">Waiting for AI response…</p>}
        <div ref={endRef} />
      </div> : <div role="tabpanel" aria-label="Confessions" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        <div className="flex items-center justify-between gap-2"><p className="text-xs text-white/65">Read-only records of what the assistant actually did.</p><button type="button" onClick={() => setConfessionsRefresh((value) => value + 1)} disabled={confessionsLoading} className="rounded-lg border border-white/20 px-2 py-1 text-xs disabled:opacity-40">Refresh</button></div>
        {confessionsLoading && <p role="status" className="text-xs text-white/60">Loading saved confessions…</p>}
        {confessionsError && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-100">{confessionsError} Session records are still shown.</p>}
        {!confessionsLoading && confessions.length === 0 && <p className="rounded-lg border border-white/10 p-3 text-sm text-white/65">No confessions yet. Send a message in Chat.</p>}
        {confessions.map((entry) => <article key={entry.traceId} className="space-y-2 rounded-xl border border-white/10 bg-white/[.04] p-3 text-xs leading-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-bold">{entry.title}</h4><span className={entry.saved ? 'text-emerald-300' : 'text-amber-200'}>{entry.saved ? 'Saved' : 'Session only'}</span></div>
          <p><strong className="text-white">Truth:</strong> <span className="text-white/75">{entry.truth}</span></p>
          {entry.what && <p><strong>What:</strong> <span className="text-white/75">{entry.what}</span></p>}
          {entry.why && <p><strong>Why:</strong> <span className="text-white/75">{entry.why}</span></p>}
          {entry.how && <p><strong>How:</strong> <span className="text-white/75">{entry.how}</span></p>}
          {entry.detail && <p className="text-white/55">{entry.detail}</p>}
        </article>)}
      </div>}

      {failure && <div role="alert" className="shrink-0 border-t border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"><p className="break-words">{failure.message}</p><div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold underline underline-offset-2">{failure.code === 'AUTH_REQUIRED' && <Link href="/login">Sign in</Link>}{failure.code === 'UPGRADE_REQUIRED' && <Link href="/subscription">View plans</Link>}{failure.code === 'AI_NOT_CONFIGURED' && <Link href="/contact">Contact support</Link>}<button type="button" onClick={() => setFailure(null)}>Dismiss</button></div></div>}
      {tab === 'chat' && <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="shrink-0 border-t border-white/10 bg-[#0c0c10] p-3"><div className="flex min-w-0 items-end gap-2 rounded-xl border border-white/15 bg-white/[.045] p-2 focus-within:border-violet-400/60"><textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} rows={2} maxLength={10000} placeholder="Ask a question…" aria-label="Message the AI assistant" className="min-h-[48px] min-w-0 flex-1 resize-none bg-transparent px-1 py-1 text-sm leading-5 text-white outline-none placeholder:text-white/40" /><button type="submit" disabled={!input.trim() || loading} className="h-10 shrink-0 rounded-xl bg-violet-600 px-3 text-sm font-bold text-white disabled:opacity-40">Send</button></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/65"><button type="button" onClick={() => { setInput(`Help me understand this page: ${pathname}`); inputRef.current?.focus(); }} className="rounded px-1.5 py-1 hover:bg-white/10">This page</button><button type="button" onClick={() => { setInput('Help me troubleshoot an error: '); inputRef.current?.focus(); }} className="rounded px-1.5 py-1 hover:bg-white/10">Troubleshoot</button><Link href={dashboardUrl} className="rounded px-1.5 py-1 hover:bg-white/10">Dashboard</Link></div></form>}
    </section>}
  </>;
}

export { UniversalAIAssistant };
