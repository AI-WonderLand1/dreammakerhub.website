'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, CornerDownLeft, MousePointer2, Sparkles, WandSparkles } from 'lucide-react';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { acceptsChildren } from '../dnd-utils';
import { BLOCKS } from '../blocks';
import { findBlockDefinition } from '../blocks/utils';

type Message = { role: 'user' | 'assistant'; content: string };
type BuilderAction =
  | { action: 'add'; block: { type: string; name?: string; icon?: string; props?: Record<string, unknown>; styles?: Record<string, unknown> }; target?: 'root' | 'selected' }
  | { action: 'edit'; targetId?: string; props?: Record<string, unknown>; styles?: Record<string, unknown> };

const SUGGESTIONS = [
  'Build me a complete coffee shop website',
  'Build a modern SaaS landing page',
  'Improve the selected element',
  'Add a responsive contact section',
];

const FALLBACK_BLOCKS: Array<[string, string]> = [
  ['hero', 'hero'], ['feature', 'feature-grid'], ['pricing', 'pricing'], ['contact', 'contact-form'],
  ['gallery', 'gallery'], ['button', 'button'], ['navigation', 'navbar'], ['navbar', 'navbar'],
  ['video', 'video'], ['columns', 'columns'], ['footer', 'section'],
];

const FORBIDDEN_KEYS = new Set(['dangerouslySetInnerHTML', 'innerHTML', 'outerHTML', 'clickJs', 'customCSS', 'srcDoc', 'srcdoc']);
const BLOCK_CATALOG = BLOCKS.map((block) => block.type).filter(Boolean).join(', ').slice(0, 2800);

function findElement(elements: CanvasElement[], id: string | null): CanvasElement | null {
  if (!id) return null;
  for (const element of elements) {
    if (element.id === id) return element;
    const nested = findElement(element.children || [], id);
    if (nested) return nested;
  }
  return null;
}

function sanitizeUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (raw.startsWith('#') || raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('?')) return raw;
  try {
    const url = new URL(raw);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol.toLowerCase()) ? raw : '#';
  } catch { return '#'; }
}

function sanitizeObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key) || /^on[A-Z]/.test(key) || /^on[a-z]/.test(key)) continue;
    if (typeof value === 'string' && /(?:url|href|src|link)$/i.test(key)) { output[key] = sanitizeUrl(value); continue; }
    if (Array.isArray(value)) { output[key] = value.map((entry) => entry && typeof entry === 'object' && !Array.isArray(entry) ? sanitizeObject(entry) : entry); continue; }
    if (value && typeof value === 'object') { output[key] = sanitizeObject(value); continue; }
    if (['string', 'number', 'boolean'].includes(typeof value) || value === null) output[key] = value;
  }
  return output;
}

function buildSystemPrompt(pageName: string, selected: CanvasElement | null) {
  const selectedContext = selected ? JSON.stringify({ id: selected.id, type: selected.type, name: selected.name, props: selected.props, styles: selected.styles }, null, 2) : 'No element is selected.';
  return `You are WonderBuild AI Assist inside a live drag-and-drop website editor. You are an ACTION assistant, not a placeholder chat bot.
The active page is ${JSON.stringify(pageName)}. Whatever the user asks to build, make, create, redesign, or edit should be applied to the live builder state using machine actions.

Selected element:
${selectedContext}

Available WonderBuild block types include:
${BLOCK_CATALOG}

For ONE edit you may return:
---BUILDER_ACTION
{"action":"edit","targetId":"selected","props":{"content":"New text"},"styles":{"fontSize":"48px"}}
---END

For a full page or multi-part request, return 2-10 actions as a JSON array:
---BUILDER_ACTIONS
[
 {"action":"add","block":{"type":"navbar","props":{},"styles":{}},"target":"root"},
 {"action":"add","block":{"type":"hero","props":{"title":"Specific title for the user's business"},"styles":{}},"target":"root"},
 {"action":"add","block":{"type":"feature-grid","props":{},"styles":{}},"target":"root"},
 {"action":"add","block":{"type":"contact-form","props":{},"styles":{}},"target":"root"}
]
---END

Rules:
- If the user says something broad like “make me a coffee shop”, “build a portfolio”, or “create a SaaS site”, BUILD a useful complete page with multiple appropriate sections. Do not merely describe what you could build.
- Use only block types from the catalog. Prefer existing blocks and their default props over inventing unknown types.
- Make content specific to the user's request, not “Lorem ipsum”, “Placeholder”, “Sample”, or generic fake copy.
- Use edit for the selected/current element when appropriate.
- Use target selected for add only when the selected element accepts children; otherwise use root.
- Keep props/styles plain JSON and CSS-in-JS camelCase.
- Never generate scripts, JS handlers, raw custom HTML, dangerouslySetInnerHTML, srcdoc, javascript: URLs, custom CSS, or webhook code.
- Do not claim something was built unless you returned at least one valid machine action.
- Keep the human explanation short.`;
}

function extractActions(text: string): BuilderAction[] {
  const multi = text.match(/---BUILDER_ACTIONS\s*([\s\S]*?)\s*---END/);
  if (multi) {
    try {
      const parsed = JSON.parse(multi[1]);
      if (Array.isArray(parsed)) return parsed.filter((action) => action?.action === 'add' || action?.action === 'edit').slice(0, 10);
    } catch {}
  }
  const single = text.match(/---BUILDER_ACTION\s*([\s\S]*?)\s*---END/);
  if (single) {
    try {
      const parsed = JSON.parse(single[1]);
      if (parsed?.action === 'add' || parsed?.action === 'edit') return [parsed];
    } catch {}
  }
  return [];
}

function stripActions(text: string) {
  return text.replace(/---BUILDER_ACTIONS\s*[\s\S]*?\s*---END/g, '').replace(/---BUILDER_ACTION\s*[\s\S]*?\s*---END/g, '').trim();
}

function applyQuickLocalEdit(prompt: string, selected: CanvasElement | null): boolean {
  if (!selected) return false;
  const lower = prompt.toLowerCase();
  const styles: Record<string, unknown> = {};
  const props: Record<string, unknown> = {};
  if (/\b(center|centered)\b/.test(lower)) styles.textAlign = 'center';
  if (/\b(bold|bolder)\b/.test(lower)) styles.fontWeight = '700';
  if (/\b(rounded|rounder)\b/.test(lower)) styles.borderRadius = '16px';
  if (/\b(full width|full-width)\b/.test(lower)) styles.width = '100%';
  if (/\b(bigger|larger)\b/.test(lower)) styles.fontSize = '48px';
  if (/\b(smaller)\b/.test(lower)) styles.fontSize = '18px';
  const wantsBackground = lower.includes('background');
  const colors: Array<[RegExp, string]> = [[/\bpurple\b/, '#8b5cf6'], [/\bblue\b/, '#3b82f6'], [/\bcyan\b/, '#22d3ee'], [/\bgreen\b/, '#22c55e'], [/\bwhite\b/, '#ffffff'], [/\bblack\b/, '#050816']];
  for (const [pattern, color] of colors) if (pattern.test(lower)) { styles[wantsBackground ? 'backgroundColor' : 'color'] = color; break; }
  const textMatch = prompt.match(/(?:change|set|make)\s+(?:the\s+)?(?:text|label|title)\s+(?:to\s+)?["“'](.+?)["”']/i);
  if (textMatch) {
    if ('content' in (selected.props || {})) props.content = textMatch[1];
    else if ('label' in (selected.props || {})) props.label = textMatch[1];
    else if ('title' in (selected.props || {})) props.title = textMatch[1];
  }
  if (!Object.keys(props).length && !Object.keys(styles).length) return false;
  const store = useBuilderStore.getState();
  if (Object.keys(props).length) store.updateElementProps(selected.id, props);
  if (Object.keys(styles).length) store.updateElementStyles(selected.id, styles);
  return true;
}

export default function AIAssistantPanel() {
  const pages = useBuilderStore((state) => state.pages);
  const activePageId = useBuilderStore((state) => state.activePageId);
  const elements = useBuilderStore((state) => state.elements);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const selectElement = useBuilderStore((state) => state.selectElement);
  const activePage = pages.find((page) => page.id === activePageId);
  const selected = useMemo(() => findElement(elements, selectedId), [elements, selectedId]);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Tell me what you want. I can edit the selected item or build a complete page from a normal request like “make me a coffee shop website”.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, loading]);

  const applyAction = useCallback((action: BuilderAction): string | null => {
    const store = useBuilderStore.getState();
    const currentSelected = findElement(store.elements, store.selectedId);
    if (action.action === 'edit') {
      const targetId = action.targetId === 'selected' || !action.targetId ? currentSelected?.id : action.targetId;
      const target = findElement(store.elements, targetId || null);
      if (!target) return null;
      const props = sanitizeObject(action.props); const styles = sanitizeObject(action.styles);
      if (Object.keys(props).length) store.updateElementProps(target.id, props);
      if (Object.keys(styles).length) store.updateElementStyles(target.id, styles);
      store.selectElement(target.id); return `Updated ${target.name}`;
    }
    const definition = findBlockDefinition(action.block?.type || '');
    if (!definition) return null;
    const element: CanvasElement = {
      id: `el-${Date.now()}-ai-${Math.random().toString(36).slice(2, 7)}`,
      type: definition.type,
      name: action.block.name?.slice(0, 80) || definition.name,
      icon: action.block.icon || definition.icon,
      props: { ...definition.defaultProps, ...sanitizeObject(action.block.props) },
      styles: { ...definition.defaultStyles, ...sanitizeObject(action.block.styles) },
    };
    const parentId = action.target === 'selected' && currentSelected && acceptsChildren(currentSelected.type) ? currentSelected.id : undefined;
    store.addElement(element, parentId); store.selectElement(element.id);
    return `Added ${element.name}`;
  }, []);

  const addFallbackBlock = useCallback((prompt: string): string | null => {
    const lower = prompt.toLowerCase();
    const store = useBuilderStore.getState();
    for (const [keyword, type] of FALLBACK_BLOCKS) {
      if (!lower.includes(keyword)) continue;
      const definition = findBlockDefinition(type); if (!definition) continue;
      const element: CanvasElement = { id: `el-${Date.now()}-fallback`, type: definition.type, name: definition.name, icon: definition.icon, props: { ...definition.defaultProps }, styles: { ...definition.defaultStyles } };
      store.addElement(element); store.selectElement(element.id); return `Added ${definition.name}`;
    }
    return null;
  }, []);

  const handleSend = useCallback(async (override?: string) => {
    const promptText = (override ?? input).trim(); if (!promptText || loading) return;
    setMessages((previous) => [...previous, { role: 'user', content: promptText }]); setInput(''); setLoading(true); setLastApplied(null);
    const liveStore = useBuilderStore.getState();
    const liveSelected = findElement(liveStore.elements, liveStore.selectedId);
    const livePage = liveStore.pages.find((page) => page.id === liveStore.activePageId);
    let remoteError = '';
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `${buildSystemPrompt(livePage?.name || 'Home', liveSelected)}\n\nUser request: ${promptText}` }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || `AI request failed (${response.status})`);
      const reply = typeof data.text === 'string' ? data.text.trim() : '';
      if (!reply) throw new Error('AI returned an empty response');
      const actions = extractActions(reply);
      const applied = actions.map(applyAction).filter((value): value is string => Boolean(value));
      const asksToBuild = /\b(build|make|create|generate|add|design|redesign)\b/i.test(promptText);
      if (asksToBuild && applied.length === 0) throw new Error('AI replied without a valid builder action');
      if (applied.length) setLastApplied(`${applied.length} live change${applied.length === 1 ? '' : 's'} applied`);
      const explanation = stripActions(reply);
      setMessages((previous) => [...previous, { role: 'assistant', content: explanation || (applied.length ? `Applied ${applied.length} live change${applied.length === 1 ? '' : 's'}.` : reply) }]);
      return;
    } catch (error) {
      remoteError = error instanceof Error ? error.message : 'AI request failed';
    } finally { setLoading(false); }

    if (applyQuickLocalEdit(promptText, liveSelected)) {
      setLastApplied(`Updated ${liveSelected?.name || 'selected element'}`);
      setMessages((previous) => [...previous, { role: 'assistant', content: 'Applied that change directly to the selected element.' }]); return;
    }
    const added = addFallbackBlock(promptText);
    if (added) {
      setLastApplied(added); setMessages((previous) => [...previous, { role: 'assistant', content: `${added}. The AI service could not complete the richer version, so I applied the real local block instead.` }]); return;
    }
    setMessages((previous) => [...previous, { role: 'assistant', content: `I could not apply that request. ${remoteError || 'No valid builder action was returned.'}` }]);
  }, [addFallbackBlock, applyAction, input, loading]);

  const runSuggestion = (suggestion: string) => { setInput(suggestion); void handleSend(suggestion); };

  return <div className="flex h-full w-full flex-col overflow-hidden bg-[#080d1b] text-white">
    <div className="shrink-0 border-b border-white/8 bg-gradient-to-b from-violet-500/[.07] to-transparent px-3 py-3">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10"><WandSparkles className="h-4 w-4 text-violet-200" /></span><div><div className="text-[13px] font-extrabold text-white">AI Assist</div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-violet-200/45">Builds on the live canvas</div></div></div><span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-500/[.07] px-2 py-1 text-[10px] font-extrabold text-emerald-200/80"><Check className="h-3 w-3" /> Same canvas</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2"><div className="text-[10px] font-extrabold uppercase text-white/35">Page</div><div className="mt-0.5 truncate text-[12px] font-bold text-white/75">{activePage?.name || 'Home'}</div></div><button type="button" onClick={() => selected && selectElement(selected.id)} className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2 text-left"><div className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-white/35"><MousePointer2 className="h-3 w-3" /> Selected</div><div className={`mt-0.5 truncate text-[12px] font-bold ${selected ? 'text-violet-100/85' : 'text-white/30'}`}>{selected?.name || 'Nothing selected'}</div></button></div>
    </div>

    <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-xl border px-3 py-2.5 text-[13px] font-semibold leading-5 ${message.role === 'user' ? 'border-violet-400/20 bg-violet-500/15 text-violet-50' : 'border-white/8 bg-white/[.04] text-white/80'}`}>{message.content}</div></div>)}{loading && <div className="inline-flex items-center gap-2 rounded-xl border border-violet-300/10 bg-violet-500/[.06] px-3 py-2 text-[13px] font-bold text-violet-100/70"><Sparkles className="h-4 w-4 animate-pulse" /> Building on the live canvas…</div>}</div>

    {lastApplied && <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-500/[.07] px-2.5 py-2 text-[11px] font-extrabold text-emerald-200/80"><Check className="h-3.5 w-3.5" /> {lastApplied}</div>}

    <div className="shrink-0 border-t border-white/8 p-3"><div className="mb-2 flex gap-1 overflow-x-auto pb-1">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => runSuggestion(suggestion)} disabled={loading} className="shrink-0 rounded-full border border-white/8 bg-white/[.03] px-2.5 py-1.5 text-[10px] font-extrabold text-white/45 hover:border-violet-300/20 hover:bg-violet-500/10 hover:text-violet-100 disabled:opacity-30">{suggestion}</button>)}</div><div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 focus-within:border-violet-400/35"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} rows={2} placeholder={selected ? `Tell AI what to do to ${selected.name}…` : 'Describe anything you want built…'} className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] font-semibold leading-5 text-white outline-none placeholder:text-white/30" /><button type="button" onClick={() => void handleSend()} disabled={loading || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white disabled:opacity-35" aria-label="Send AI request">{loading ? <Bot className="h-4 w-4 animate-pulse" /> : <CornerDownLeft className="h-4 w-4" />}</button></div><p className="mt-1.5 text-center text-[10px] font-semibold text-white/25">Normal language → real builder actions on this page.</p></div>
  </div>;
}
