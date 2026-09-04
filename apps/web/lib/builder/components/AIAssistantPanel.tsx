'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, CornerDownLeft, MousePointer2, Sparkles, WandSparkles } from 'lucide-react';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { acceptsChildren } from '../dnd-utils';
import { findBlockDefinition } from '../blocks/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type BuilderAction =
  | {
      action: 'add';
      block: {
        type: string;
        name?: string;
        icon?: string;
        props?: Record<string, unknown>;
        styles?: Record<string, unknown>;
      };
      target?: 'root' | 'selected';
    }
  | {
      action: 'edit';
      targetId?: string;
      props?: Record<string, unknown>;
      styles?: Record<string, unknown>;
    };

const SUGGESTIONS = [
  'Improve the selected element',
  'Make the selected element look more premium',
  'Add a hero section',
  'Add a CTA button inside this section',
  'Make this page more responsive',
  'Create a 3-column feature section',
];

const FALLBACK_BLOCKS: Array<[string, string]> = [
  ['hero', 'hero'],
  ['feature', 'feature-grid'],
  ['pricing', 'pricing'],
  ['contact', 'contact-form'],
  ['gallery', 'gallery'],
  ['button', 'button'],
  ['navigation', 'navbar'],
  ['navbar', 'navbar'],
  ['video', 'video'],
  ['columns', 'columns'],
  ['footer', 'section'],
];

const FORBIDDEN_KEYS = new Set([
  'dangerouslySetInnerHTML',
  'innerHTML',
  'outerHTML',
  'clickJs',
  'customCSS',
  'srcDoc',
  'srcdoc',
]);

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
  if (raw.startsWith('#') || raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('?')) {
    return raw;
  }
  try {
    const url = new URL(raw);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol.toLowerCase()) ? raw : '#';
  } catch {
    return '#';
  }
}

function sanitizeObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key) || /^on[A-Z]/.test(key) || /^on[a-z]/.test(key)) continue;

    if (typeof value === 'string' && /(?:url|href|src|link)$/i.test(key)) {
      output[key] = sanitizeUrl(value);
      continue;
    }

    if (Array.isArray(value)) {
      output[key] = value.map((entry) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) return sanitizeObject(entry);
        return entry;
      });
      continue;
    }

    if (value && typeof value === 'object') {
      output[key] = sanitizeObject(value);
      continue;
    }

    if (['string', 'number', 'boolean'].includes(typeof value) || value === null) {
      output[key] = value;
    }
  }

  return output;
}

function buildSystemPrompt(pageName: string, selected: CanvasElement | null) {
  const selectedContext = selected
    ? JSON.stringify(
        {
          id: selected.id,
          type: selected.type,
          name: selected.name,
          props: selected.props,
          styles: selected.styles,
        },
        null,
        2,
      )
    : 'No element is currently selected.';

  return `You are WonderBuild AI Assist inside a live drag-and-drop website editor.
You edit the SAME builder state the user is looking at. The active page is ${JSON.stringify(pageName)}.

Selected element context:
${selectedContext}

You may return at most ONE machine action after your short human explanation.

To edit the selected element:
---BUILDER_ACTION
{"action":"edit","targetId":"selected","props":{"content":"New text"},"styles":{"fontSize":"48px","color":"#a78bfa"}}
---END

To add a normal WonderBuild catalog block:
---BUILDER_ACTION
{"action":"add","block":{"type":"button","props":{"label":"Get started","url":"#contact"},"styles":{}},"target":"selected"}
---END

Rules:
- Use edit when the user says this, selected, current element, heading, button, image, etc. and an element is selected.
- Use target selected for add only when the selected element is a container; otherwise use root.
- Use normal CSS-in-JS camelCase style keys.
- Keep props/styles as plain JSON values.
- Never generate scripts, JavaScript handlers, custom HTML, dangerouslySetInnerHTML, srcdoc, javascript: URLs, custom CSS, or webhook code.
- Do not replace the whole page for a small edit.
- If no machine action is needed, answer normally without an action block.
- Be concise.`;
}

function extractAction(text: string): BuilderAction | null {
  const match = text.match(/---BUILDER_ACTION\s*([\s\S]*?)\s*---END/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]) as BuilderAction;
    if (!parsed || (parsed.action !== 'add' && parsed.action !== 'edit')) return null;
    return parsed;
  } catch {
    return null;
  }
}

function stripAction(text: string): string {
  return text.replace(/---BUILDER_ACTION\s*[\s\S]*?\s*---END/, '').trim();
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
  const colors: Array<[RegExp, string]> = [
    [/\bpurple\b/, '#8b5cf6'],
    [/\bblue\b/, '#3b82f6'],
    [/\bcyan\b/, '#22d3ee'],
    [/\bgreen\b/, '#22c55e'],
    [/\bwhite\b/, '#ffffff'],
    [/\bblack\b/, '#050816'],
  ];
  for (const [pattern, color] of colors) {
    if (pattern.test(lower)) {
      styles[wantsBackground ? 'backgroundColor' : 'color'] = color;
      break;
    }
  }

  const textMatch = prompt.match(/(?:change|set|make)\s+(?:the\s+)?(?:text|label|title)\s+(?:to\s+)?["“'](.+?)["”']/i);
  if (textMatch) {
    if (Object.prototype.hasOwnProperty.call(selected.props || {}, 'content')) props.content = textMatch[1];
    else if (Object.prototype.hasOwnProperty.call(selected.props || {}, 'label')) props.label = textMatch[1];
    else if (Object.prototype.hasOwnProperty.call(selected.props || {}, 'title')) props.title = textMatch[1];
  }

  if (Object.keys(props).length === 0 && Object.keys(styles).length === 0) return false;
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

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Select anything on the canvas and tell me what to change, or ask me to add a section. I edit the same page your drag-and-drop builder is using.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const applyAction = useCallback((action: BuilderAction): string | null => {
    const store = useBuilderStore.getState();
    const currentSelected = findElement(store.elements, store.selectedId);

    if (action.action === 'edit') {
      const targetId = action.targetId === 'selected' || !action.targetId ? currentSelected?.id : action.targetId;
      const target = findElement(store.elements, targetId || null);
      if (!target) return 'Select an element first so I know what to edit.';

      const props = sanitizeObject(action.props);
      const styles = sanitizeObject(action.styles);
      if (Object.keys(props).length) store.updateElementProps(target.id, props);
      if (Object.keys(styles).length) store.updateElementStyles(target.id, styles);
      store.selectElement(target.id);
      return `Updated ${target.name}`;
    }

    const definition = findBlockDefinition(action.block?.type || '');
    if (!definition) return `I could not add “${action.block?.type || 'that block'}” because it is not in the WonderBuild component catalog.`;

    const id = `el-${Date.now()}-ai-${Math.random().toString(36).slice(2, 6)}`;
    const element: CanvasElement = {
      id,
      type: definition.type,
      name: action.block.name?.slice(0, 80) || definition.name,
      icon: action.block.icon || definition.icon,
      props: {
        ...definition.defaultProps,
        ...sanitizeObject(action.block.props),
      },
      styles: {
        ...definition.defaultStyles,
        ...sanitizeObject(action.block.styles),
      },
    };

    const parentId =
      action.target === 'selected' && currentSelected && acceptsChildren(currentSelected.type)
        ? currentSelected.id
        : undefined;

    store.addElement(element, parentId);
    store.selectElement(element.id);
    return `Added ${element.name}${parentId ? ` inside ${currentSelected?.name}` : ''}`;
  }, []);

  const addFallbackBlock = useCallback((prompt: string): string | null => {
    const lower = prompt.toLowerCase();
    const store = useBuilderStore.getState();
    const currentSelected = findElement(store.elements, store.selectedId);

    for (const [keyword, type] of FALLBACK_BLOCKS) {
      if (!lower.includes(keyword)) continue;
      const definition = findBlockDefinition(type);
      if (!definition) continue;
      const element: CanvasElement = {
        id: `el-${Date.now()}-ai-${Math.random().toString(36).slice(2, 6)}`,
        type: definition.type,
        name: definition.name,
        icon: definition.icon,
        props: { ...definition.defaultProps },
        styles: { ...definition.defaultStyles },
      };
      const wantsInside = /\b(inside|in this|within)\b/.test(lower);
      const parentId = wantsInside && currentSelected && acceptsChildren(currentSelected.type) ? currentSelected.id : undefined;
      store.addElement(element, parentId);
      store.selectElement(element.id);
      return `Added ${definition.name}${parentId ? ` inside ${currentSelected?.name}` : ''}`;
    }

    return null;
  }, []);

  const handleSend = useCallback(async (override?: string) => {
    const promptText = (override ?? input).trim();
    if (!promptText || loading) return;

    setMessages((previous) => [...previous, { role: 'user', content: promptText }]);
    setInput('');
    setLoading(true);
    setLastApplied(null);

    const liveStore = useBuilderStore.getState();
    const liveSelected = findElement(liveStore.elements, liveStore.selectedId);
    const livePage = liveStore.pages.find((page) => page.id === liveStore.activePageId);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${buildSystemPrompt(livePage?.name || 'Home', liveSelected)}\n\nUser request: ${promptText}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = typeof data.text === 'string' ? data.text : 'Done.';
        const action = extractAction(reply);
        const applied = action ? applyAction(action) : null;
        if (applied) setLastApplied(applied);
        setMessages((previous) => [
          ...previous,
          { role: 'assistant', content: stripAction(reply) || applied || 'Done.' },
        ]);
        return;
      }
    } catch {
      // Local fallback below keeps basic builder edits available if the AI route is unavailable.
    } finally {
      setLoading(false);
    }

    if (applyQuickLocalEdit(promptText, liveSelected)) {
      setLastApplied(`Updated ${liveSelected?.name || 'selected element'}`);
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: 'Applied that change directly to the selected element.' },
      ]);
      return;
    }

    const added = addFallbackBlock(promptText);
    if (added) {
      setLastApplied(added);
      setMessages((previous) => [...previous, { role: 'assistant', content: `${added}.` }]);
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: 'assistant',
        content: liveSelected
          ? `I could not apply that automatically. Try “make this purple”, “make this bigger”, “center this”, or ask me to add a specific component.`
          : 'Select an element to edit it with AI, or ask me to add a specific component such as a hero, button, gallery, or contact form.',
      },
    ]);
  }, [addFallbackBlock, applyAction, input, loading]);

  const runSuggestion = (suggestion: string) => {
    setInput(suggestion);
    void handleSend(suggestion);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080d1b] text-white">
      <div className="shrink-0 border-b border-white/8 bg-gradient-to-b from-violet-500/[.07] to-transparent px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10 shadow-[0_0_22px_rgba(139,92,246,.12)]">
              <WandSparkles className="h-4 w-4 text-violet-200" />
            </span>
            <div>
              <div className="text-[11px] font-black text-white">AI Assist</div>
              <div className="text-[8px] font-bold uppercase tracking-[.14em] text-violet-200/35">Live builder context</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-500/[.07] px-2 py-1 text-[8px] font-black text-emerald-200/70">
            <Check className="h-3 w-3" /> Same canvas
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2">
            <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/25">Page</div>
            <div className="mt-0.5 truncate text-[10px] font-bold text-white/65">{activePage?.name || 'Home'}</div>
          </div>
          <button
            type="button"
            onClick={() => selected && selectElement(selected.id)}
            className={`rounded-lg border px-2.5 py-2 text-left transition ${
              selected
                ? 'border-violet-300/15 bg-violet-500/[.07] hover:bg-violet-500/10'
                : 'border-white/8 bg-black/20'
            }`}
          >
            <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[.12em] text-white/25">
              <MousePointer2 className="h-3 w-3" /> Selected
            </div>
            <div className={`mt-0.5 truncate text-[10px] font-bold ${selected ? 'text-violet-100/80' : 'text-white/25'}`}>
              {selected?.name || 'Nothing selected'}
            </div>
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-xl border px-3 py-2 text-[10px] leading-relaxed whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'border-violet-400/20 bg-violet-500/15 text-violet-100'
                  : 'border-white/7 bg-white/[.035] text-white/65'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-xl border border-violet-300/10 bg-violet-500/[.06] px-3 py-2 text-[10px] text-violet-100/60">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Editing the live builder…
            </div>
          </div>
        )}
      </div>

      {lastApplied && (
        <div className="mx-3 mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-500/[.07] px-2.5 py-2 text-[9px] font-bold text-emerald-200/70">
          <Check className="h-3.5 w-3.5" /> {lastApplied}
        </div>
      )}

      <div className="shrink-0 border-t border-white/8 p-3">
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {SUGGESTIONS.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => runSuggestion(suggestion)}
              disabled={loading || (suggestion.toLowerCase().includes('selected') && !selected)}
              className="shrink-0 rounded-full border border-white/8 bg-white/[.03] px-2 py-1 text-[8px] font-bold text-white/35 transition hover:border-violet-300/20 hover:bg-violet-500/10 hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 transition focus-within:border-violet-400/35 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,.06)]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            placeholder={selected ? `Ask AI to edit ${selected.name}…` : 'Ask AI to add or improve something…'}
            className="min-h-[42px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[10px] leading-relaxed text-white outline-none placeholder:text-white/20"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_6px_18px_rgba(124,58,237,.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Send AI request"
          >
            {loading ? <Bot className="h-3.5 w-3.5 animate-pulse" /> : <CornerDownLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[8px] text-white/15">AI actions update the same page state used by drag/drop and the inspector.</p>
      </div>
    </div>
  );
}
