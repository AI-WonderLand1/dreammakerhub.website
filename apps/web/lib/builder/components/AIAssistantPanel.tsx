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
  | {
      action: 'add';
      block: { type: string; name?: string; icon?: string; props?: Record<string, unknown>; styles?: Record<string, unknown> };
      target?: 'root' | 'selected';
      imagePrompt?: string;
      imageCount?: number;
    }
  | {
      action: 'edit';
      targetId?: string;
      props?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      imagePrompt?: string;
      imageCount?: number;
    };

type AppliedAction = {
  label: string;
  elementId: string;
  imagePrompt?: string;
  imageCount?: number;
};

const SUGGESTIONS = [
  'Build me a complete coffee shop website with warm cinematic photos',
  'Build a modern SaaS landing page',
  'Create a luxury fashion page in black and gold',
  'Add a responsive contact section',
];

const FALLBACK_BLOCKS: Array<[string, string]> = [
  ['hero', 'hero'], ['feature', 'feature-grid'], ['pricing', 'pricing'], ['contact', 'contact-form'],
  ['gallery', 'gallery'], ['button', 'button'], ['navigation', 'navbar'], ['navbar', 'navbar'],
  ['video', 'video'], ['columns', 'columns'], ['footer', 'section'],
];

const FORBIDDEN_KEYS = new Set(['dangerouslySetInnerHTML', 'innerHTML', 'outerHTML', 'clickJs', 'customCSS', 'srcDoc', 'srcdoc']);
const BLOCK_CATALOG = BLOCKS.map((block) => block.type).filter(Boolean).join(', ').slice(0, 2800);
const DIRECT_IMAGE_KEYS = ['src', 'image', 'mediaSrc', 'poster', 'before', 'after', 'beforeSrc', 'afterSrc'] as const;

function findElement(elements: CanvasElement[], id: string | null): CanvasElement | null {
  if (!id) return null;
  for (const element of elements) {
    if (element.id === id) return element;
    const nested = findElement(element.children || [], id);
    if (nested) return nested;
  }
  return null;
}

function summarizeElements(elements: CanvasElement[], depth = 0): Array<Record<string, unknown>> {
  if (depth > 3) return [];
  return elements.slice(0, 40).map((element) => ({
    id: element.id,
    type: element.type,
    name: element.name,
    props: element.props,
    children: element.children?.length ? summarizeElements(element.children, depth + 1) : undefined,
  }));
}

function sanitizeUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (raw.startsWith('#') || raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('?')) return raw;
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
      output[key] = value.map((entry) => entry && typeof entry === 'object' && !Array.isArray(entry) ? sanitizeObject(entry) : entry);
      continue;
    }
    if (value && typeof value === 'object') {
      output[key] = sanitizeObject(value);
      continue;
    }
    if (['string', 'number', 'boolean'].includes(typeof value) || value === null) output[key] = value;
  }
  return output;
}

function buildSystemPrompt(pageName: string, selected: CanvasElement | null, elements: CanvasElement[]) {
  const selectedContext = selected
    ? JSON.stringify({ id: selected.id, type: selected.type, name: selected.name, props: selected.props, styles: selected.styles }, null, 2)
    : 'Nothing is selected. Do not ask the user to select anything. Infer the intended target from the page structure and the request.';
  const pageContext = JSON.stringify(summarizeElements(elements), null, 2).slice(0, 9000);

  return `You are WonderBuild AI Assist inside a live drag-and-drop website editor. You are an ACTION assistant, not a placeholder chat bot.
The active page is ${JSON.stringify(pageName)}. Whatever the user asks to build, make, create, redesign, restyle, translate, or edit must be applied to the live builder state using machine actions.

The user may write in ANY human language and may request ANY visual style. Understand the request without requiring English. Preserve the user's requested language for visible page copy unless they ask for another language.
A selection is NEVER required. If nothing is selected, infer which existing element(s) to edit from the page structure, or add the appropriate blocks at root.

Selected element:
${selectedContext}

Current page structure:
${pageContext}

Available WonderBuild block types include:
${BLOCK_CATALOG}

For ONE edit you may return:
---BUILDER_ACTION
{"action":"edit","targetId":"existing-element-id","props":{"content":"New text"},"styles":{"fontSize":"48px"},"imagePrompt":"optional description of the exact replacement image in any style/language","imageCount":1}
---END

For a full page or multi-part request, return 2-10 actions as a JSON array:
---BUILDER_ACTIONS
[
 {"action":"add","block":{"type":"navbar","props":{},"styles":{}},"target":"root"},
 {"action":"add","block":{"type":"cover","props":{"content":"Specific title for the user's business"},"styles":{}},"target":"root","imagePrompt":"wide cinematic hero image matching the user's requested subject and style","imageCount":1},
 {"action":"add","block":{"type":"product-grid-3","props":{"heading":"Featured"},"styles":{}},"target":"root","imagePrompt":"three distinct product photos matching the user's business and requested visual style","imageCount":3},
 {"action":"add","block":{"type":"contact-form","props":{},"styles":{}},"target":"root"}
]
---END

Rules:
- If the user gives a broad prompt like “make me a coffee shop”, “build a portfolio”, “create a SaaS site”, or the same request in any other language, BUILD the useful complete page. Do not ask them to select an element first.
- Use only block types from the catalog. Prefer existing blocks and their default props over inventing unknown types.
- Make content specific to the user's request, not “Lorem ipsum”, “Placeholder”, “Sample”, or generic fake copy.
- When the page or requested edit needs imagery, include imagePrompt on the relevant add/edit action. The imagePrompt must describe the actual requested subject plus the requested visual style. It may be written in the user's language.
- For galleries and product grids, use imageCount between 2 and 6 so each slot can receive a distinct generated image.
- If the user asks only for an image and nothing suitable is selected, add an image, cover, gallery, or other image-capable block and include imagePrompt. Do not require selection.
- For an existing target, use its real targetId from Current page structure. Use targetId “selected” only when the selected item really is the intended target.
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
  return text
    .replace(/---BUILDER_ACTIONS\s*[\s\S]*?\s*---END/g, '')
    .replace(/---BUILDER_ACTION\s*[\s\S]*?\s*---END/g, '')
    .trim();
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
    [/\bpurple\b/, '#8b5cf6'], [/\bblue\b/, '#3b82f6'], [/\bcyan\b/, '#22d3ee'],
    [/\bgreen\b/, '#22c55e'], [/\bwhite\b/, '#ffffff'], [/\bblack\b/, '#050816'],
  ];
  for (const [pattern, color] of colors) {
    if (pattern.test(lower)) {
      styles[wantsBackground ? 'backgroundColor' : 'color'] = color;
      break;
    }
  }
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

function desiredImageCount(element: CanvasElement, requested = 1): number {
  const props = element.props || {};
  const bounded = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1, 6));
  if (Array.isArray(props.products)) return Math.min(Math.max(bounded, 1), Math.max(props.products.length, 1));
  if (Array.isArray(props.images)) return Math.min(Math.max(bounded, 1), Math.max(props.images.length, 1));
  if (Array.isArray(props.thumbs)) return Math.min(Math.max(bounded, 1), Math.max(props.thumbs.length, 1));
  return 1;
}

async function generateImageAsset(prompt: string): Promise<string> {
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, type: 'builder' }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.imageUrl !== 'string' || !data.imageUrl) {
    throw new Error(data.error || `Image generation failed (${response.status})`);
  }
  return data.imageUrl;
}

function applyGeneratedImages(elementId: string, urls: string[]) {
  if (!urls.length) return;
  const store = useBuilderStore.getState();
  const target = findElement(store.elements, elementId);
  if (!target) return;
  const currentProps = target.props || {};
  const patch: Record<string, unknown> = {};

  if (Array.isArray(currentProps.products) && currentProps.products.length) {
    patch.products = currentProps.products.map((product, index) => {
      if (!product || typeof product !== 'object' || Array.isArray(product)) return product;
      return { ...(product as Record<string, unknown>), image: urls[index % urls.length] };
    });
  } else if (Array.isArray(currentProps.images)) {
    patch.images = currentProps.images.map((_, index) => urls[index % urls.length]);
  } else if (Array.isArray(currentProps.thumbs)) {
    patch.thumbs = currentProps.thumbs.map((_, index) => urls[index % urls.length]);
    if (Array.isArray(currentProps.fullsize)) patch.fullsize = currentProps.thumbs.map((_, index) => urls[index % urls.length]);
  } else {
    const directKey = DIRECT_IMAGE_KEYS.find((key) => key in currentProps)
      || (target.type === 'image' || target.type === 'ai-image' || target.type === 'avatar' || target.type === 'image-hotspot' ? 'src' : undefined);
    if (directKey) patch[directKey] = urls[0];
  }

  if (Object.keys(patch).length) store.updateElementProps(target.id, patch);
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
    { role: 'assistant', content: 'Describe what you want in any language or style. I can build the page, restyle it, change content, and create images directly on the live canvas. Selection is optional.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const applyAction = useCallback((action: BuilderAction): AppliedAction | null => {
    const store = useBuilderStore.getState();
    const currentSelected = findElement(store.elements, store.selectedId);

    if (action.action === 'edit') {
      const targetId = action.targetId === 'selected' || !action.targetId ? currentSelected?.id : action.targetId;
      const target = findElement(store.elements, targetId || null);
      if (!target) return null;
      const props = sanitizeObject(action.props);
      const styles = sanitizeObject(action.styles);
      if (Object.keys(props).length) store.updateElementProps(target.id, props);
      if (Object.keys(styles).length) store.updateElementStyles(target.id, styles);
      store.selectElement(target.id);
      return { label: `Updated ${target.name}`, elementId: target.id, imagePrompt: action.imagePrompt, imageCount: action.imageCount };
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
    store.addElement(element, parentId);
    store.selectElement(element.id);
    return { label: `Added ${element.name}`, elementId: element.id, imagePrompt: action.imagePrompt, imageCount: action.imageCount };
  }, []);

  const hydrateImages = useCallback(async (applied: AppliedAction[], userPrompt: string) => {
    let generated = 0;
    const failures: string[] = [];
    for (const item of applied) {
      if (!item.imagePrompt?.trim()) continue;
      const target = findElement(useBuilderStore.getState().elements, item.elementId);
      if (!target) continue;
      const count = desiredImageCount(target, item.imageCount || 1);
      const urls: string[] = [];
      for (let index = 0; index < count; index += 1) {
        try {
          const prompt = `${item.imagePrompt.trim()}\n\nOverall page request: ${userPrompt}\nCreate image ${index + 1} of ${count}. Make it visually distinct when multiple images are requested. Do not add text unless the user explicitly requested text in the image.`;
          urls.push(await generateImageAsset(prompt));
        } catch (error) {
          failures.push(error instanceof Error ? error.message : 'Image generation failed');
          break;
        }
      }
      if (urls.length) {
        applyGeneratedImages(item.elementId, urls);
        generated += urls.length;
      }
    }
    return { generated, failure: failures[0] || '' };
  }, []);

  const addFallbackBlock = useCallback((prompt: string): string | null => {
    const lower = prompt.toLowerCase();
    const store = useBuilderStore.getState();
    for (const [keyword, type] of FALLBACK_BLOCKS) {
      if (!lower.includes(keyword)) continue;
      const definition = findBlockDefinition(type);
      if (!definition) continue;
      const element: CanvasElement = {
        id: `el-${Date.now()}-fallback`,
        type: definition.type,
        name: definition.name,
        icon: definition.icon,
        props: { ...definition.defaultProps },
        styles: { ...definition.defaultStyles },
      };
      store.addElement(element);
      store.selectElement(element.id);
      return `Added ${definition.name}`;
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
    let remoteError = '';

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${buildSystemPrompt(livePage?.name || 'Home', liveSelected, liveStore.elements)}\n\nUser request: ${promptText}` }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || `AI request failed (${response.status})`);
      const reply = typeof data.text === 'string' ? data.text.trim() : '';
      if (!reply) throw new Error('AI returned an empty response');

      const actions = extractActions(reply);
      if (!actions.length) throw new Error('AI replied without a valid builder action');
      const applied = actions.map(applyAction).filter((value): value is AppliedAction => Boolean(value));
      if (!applied.length) throw new Error('AI actions did not match available builder blocks or page elements');

      const imageResult = await hydrateImages(applied, promptText);
      const statusParts = [`${applied.length} live change${applied.length === 1 ? '' : 's'}`];
      if (imageResult.generated) statusParts.push(`${imageResult.generated} image${imageResult.generated === 1 ? '' : 's'}`);
      setLastApplied(`${statusParts.join(' + ')} applied`);

      const explanation = stripActions(reply);
      const imageWarning = imageResult.failure && !imageResult.generated ? ` Image generation could not complete: ${imageResult.failure}` : '';
      setMessages((previous) => [...previous, {
        role: 'assistant',
        content: `${explanation || `Applied ${statusParts.join(' and ')}.`}${imageWarning}`,
      }]);
      return;
    } catch (error) {
      remoteError = error instanceof Error ? error.message : 'AI request failed';
    } finally {
      setLoading(false);
    }

    if (applyQuickLocalEdit(promptText, liveSelected)) {
      setLastApplied(`Updated ${liveSelected?.name || 'selected element'}`);
      setMessages((previous) => [...previous, { role: 'assistant', content: 'Applied that change directly to the selected element.' }]);
      return;
    }

    const added = addFallbackBlock(promptText);
    if (added) {
      setLastApplied(added);
      setMessages((previous) => [...previous, { role: 'assistant', content: `${added}. The AI service could not complete the richer version, so I applied the real local block instead.` }]);
      return;
    }

    setMessages((previous) => [...previous, { role: 'assistant', content: `I could not apply that request. ${remoteError || 'No valid builder action was returned.'}` }]);
  }, [addFallbackBlock, applyAction, hydrateImages, input, loading]);

  const runSuggestion = (suggestion: string) => {
    setInput(suggestion);
    void handleSend(suggestion);
  };

  return <div className="flex h-full w-full flex-col overflow-hidden bg-[#080d1b] text-white">
    <div className="shrink-0 border-b border-white/8 bg-gradient-to-b from-violet-500/[.07] to-transparent px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10"><WandSparkles className="h-4 w-4 text-violet-200" /></span>
          <div><div className="text-[13px] font-extrabold text-white">AI Assist</div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-violet-200/45">Prompt → live canvas</div></div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-500/[.07] px-2 py-1 text-[10px] font-extrabold text-emerald-200/80"><Check className="h-3 w-3" /> Any language</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2"><div className="text-[10px] font-extrabold uppercase text-white/35">Page</div><div className="mt-0.5 truncate text-[12px] font-bold text-white/75">{activePage?.name || 'Home'}</div></div>
        <button type="button" onClick={() => selected && selectElement(selected.id)} className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2 text-left"><div className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-white/35"><MousePointer2 className="h-3 w-3" /> Optional target</div><div className={`mt-0.5 truncate text-[12px] font-bold ${selected ? 'text-violet-100/85' : 'text-emerald-100/60'}`}>{selected?.name || 'Prompt only'}</div></button>
      </div>
    </div>

    <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
      {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-xl border px-3 py-2.5 text-[13px] font-semibold leading-5 ${message.role === 'user' ? 'border-violet-400/20 bg-violet-500/15 text-violet-50' : 'border-white/8 bg-white/[.04] text-white/80'}`}>{message.content}</div></div>)}
      {loading && <div className="inline-flex items-center gap-2 rounded-xl border border-violet-300/10 bg-violet-500/[.06] px-3 py-2 text-[13px] font-bold text-violet-100/70"><Sparkles className="h-4 w-4 animate-pulse" /> Building content and images on the live canvas…</div>}
    </div>

    {lastApplied && <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-500/[.07] px-2.5 py-2 text-[11px] font-extrabold text-emerald-200/80"><Check className="h-3.5 w-3.5" /> {lastApplied}</div>}

    <div className="shrink-0 border-t border-white/8 p-3">
      <div className="mb-2 flex gap-1 overflow-x-auto pb-1">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => runSuggestion(suggestion)} disabled={loading} className="shrink-0 rounded-full border border-white/8 bg-white/[.03] px-2.5 py-1.5 text-[10px] font-extrabold text-white/45 hover:border-violet-300/20 hover:bg-violet-500/10 hover:text-violet-100 disabled:opacity-30">{suggestion}</button>)}</div>
      <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 focus-within:border-violet-400/35">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} rows={2} placeholder="Prompt anything, in any language or visual style…" className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] font-semibold leading-5 text-white outline-none placeholder:text-white/30" />
        <button type="button" onClick={() => void handleSend()} disabled={loading || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white disabled:opacity-35" aria-label="Send AI request">{loading ? <Bot className="h-4 w-4 animate-pulse" /> : <CornerDownLeft className="h-4 w-4" />}</button>
      </div>
      <p className="mt-1.5 text-center text-[10px] font-semibold text-white/25">Selection optional. Prompt → structure + copy + style + generated images.</p>
    </div>
  </div>;
}
