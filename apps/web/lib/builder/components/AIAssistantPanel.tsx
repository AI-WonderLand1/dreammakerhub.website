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
  | { action: 'add'; ref?: string; allowDuplicate?: boolean; block: { type: string; name?: string; icon?: string; props?: Record<string, unknown>; styles?: Record<string, unknown> }; target?: 'root' | 'selected' }
  | { action: 'edit'; targetId?: string; targetRef?: string; props?: Record<string, unknown>; styles?: Record<string, unknown> }
  | { action: 'remove'; targetId?: string; targetRef?: string }
  | { action: 'generate_image'; targetId?: string; targetRef?: string; propPath?: string; prompt: string; style?: string; size?: string; alt?: string; name?: string };

const SUGGESTIONS = [
  'Build me a complete coffee shop website with real images',
  'Build a modern SaaS landing page in a cinematic style',
  'Generate a watercolor image of a city at night',
  'Redesign this page in a luxury editorial style',
];

const FORBIDDEN_KEYS = new Set(['dangerouslySetInnerHTML','innerHTML','outerHTML','clickJs','customCSS','srcDoc','srcdoc','__proto__','prototype','constructor']);
const BLOCK_CATALOG = BLOCKS.map((block) => block.type).filter(Boolean).join(', ').slice(0, 2600);
const VALID_ACTIONS = new Set<BuilderAction['action']>(['add', 'edit', 'remove', 'generate_image']);
const REUSE_ROOT_ROLES = new Set(['primary navigation','hero','features','stats','pricing','team','logo/social proof','call to action','FAQ','testimonials','contact','products','gallery']);

function findElement(elements: CanvasElement[], id: string | null): CanvasElement | null {
  if (!id) return null;
  for (const element of elements) {
    if (element.id === id) return element;
    const nested = findElement(element.children || [], id);
    if (nested) return nested;
  }
  return null;
}

function semanticRole(type: string): string {
  if (type === 'navbar') return 'primary navigation';
  if (type === 'hero' || type.startsWith('hero-')) return 'hero';
  if (type === 'feature-grid' || type.startsWith('feature-')) return 'features';
  if (type === 'pricing' || type.startsWith('pricing-')) return 'pricing';
  if (type.includes('testimonial')) return 'testimonials';
  if (type.includes('faq')) return 'FAQ';
  if (type.startsWith('contact')) return 'contact';
  if (type.startsWith('product-grid')) return 'products';
  if (type === 'gallery' || type.endsWith('-gallery')) return 'gallery';
  if (type === 'cta') return 'call to action';
  if (type === 'team-grid') return 'team';
  if (type === 'stats-section') return 'stats';
  if (type === 'logo-cloud') return 'logo/social proof';
  return type;
}

function findReusableRoot(elements: CanvasElement[], type: string): CanvasElement | null {
  const role = semanticRole(type);
  if (!REUSE_ROOT_ROLES.has(role)) return null;
  return elements.find((element) => semanticRole(element.type) === role) || null;
}

function summarizeElements(elements: CanvasElement[]) {
  const summary: Array<Record<string, unknown>> = [];
  const walk = (items: CanvasElement[], depth = 0, parentId: string | null = null) => {
    for (let index = 0; index < items.length; index += 1) {
      if (summary.length >= 40) return;
      const element = items[index];
      const compactProps = Object.fromEntries(Object.entries((element.props || {}) as Record<string, unknown>).slice(0, 10).map(([key, value]) => {
        if (typeof value === 'string') return [key, value.slice(0, 140)];
        if (Array.isArray(value)) return [key, `[${value.length} items]`];
        if (value && typeof value === 'object') return [key, '[object]'];
        return [key, value];
      }));
      summary.push({ id: element.id, type: element.type, role: semanticRole(element.type), name: element.name, parentId, index, depth, props: compactProps });
      if (element.children?.length) walk(element.children, depth + 1, element.id);
    }
  };
  walk(elements);
  return summary;
}

function summarizeRootRoles(elements: CanvasElement[]) {
  const counts: Record<string, number> = {};
  for (const element of elements) {
    const role = semanticRole(element.type);
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
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

function setNestedValue(source: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> | null {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length || segments.length > 6 || segments.some((segment) => FORBIDDEN_KEYS.has(segment) || !/^\w+$/.test(segment))) return null;
  const root: Record<string, unknown> = { ...source };
  let cursor: Record<string, unknown> | unknown[] = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const numeric = /^\d+$/.test(segment);
    const nextNumeric = /^\d+$/.test(nextSegment);
    if (numeric) {
      if (!Array.isArray(cursor)) return null;
      const position = Number(segment);
      const existing = cursor[position];
      const cloned = Array.isArray(existing) ? [...existing] : existing && typeof existing === 'object' ? { ...(existing as Record<string, unknown>) } : nextNumeric ? [] : {};
      cursor[position] = cloned;
      cursor = cloned as Record<string, unknown> | unknown[];
      continue;
    }
    if (Array.isArray(cursor)) return null;
    const existing = cursor[segment];
    const cloned = Array.isArray(existing) ? [...existing] : existing && typeof existing === 'object' ? { ...(existing as Record<string, unknown>) } : nextNumeric ? [] : {};
    cursor[segment] = cloned;
    cursor = cloned as Record<string, unknown> | unknown[];
  }
  const last = segments[segments.length - 1];
  if (/^\d+$/.test(last)) { if (!Array.isArray(cursor)) return null; cursor[Number(last)] = value; }
  else { if (Array.isArray(cursor)) return null; cursor[last] = value; }
  return root;
}

function inferImagePropPath(element: CanvasElement): string | null {
  const props = (element.props || {}) as Record<string, unknown>;
  for (const key of ['src','image','imageUrl','mediaSrc','poster','avatar','backgroundImage','thumbnail','beforeSrc','afterSrc']) if (key in props) return key;
  if (Array.isArray(props.images)) return 'images.0';
  if (Array.isArray(props.products) && props.products.length) return 'products.0.image';
  if (Array.isArray(props.items) && props.items.length && props.items[0] && typeof props.items[0] === 'object' && 'avatar' in (props.items[0] as Record<string, unknown>)) return 'items.0.avatar';
  if (Array.isArray(props.members) && props.members.length) return 'members.0.avatar';
  return null;
}

function buildSystemPrompt(pageName: string, selected: CanvasElement | null, elements: CanvasElement[]) {
  const selectedContext = selected ? JSON.stringify({ id: selected.id, type: selected.type, name: selected.name, props: selected.props, styles: selected.styles }, null, 2).slice(0, 1600) : 'No element is selected. Selection is optional; infer the target from the request and page context.';
  const pageContext = JSON.stringify(summarizeElements(elements), null, 2).slice(0, 5000);
  const roleCounts = JSON.stringify(summarizeRootRoles(elements));
  const pageState = elements.length ? 'IMPORTANT: this page already contains content. Treat it as an existing application to reconcile and improve, not a blank canvas.' : 'This page is empty, so a broad build request should create a complete initial structure.';
  return `You are WonderBuild AI Assist inside a production-quality live website/app builder. You are an ACTION planner, not a chat-only assistant.
The active page is ${JSON.stringify(pageName)}. Apply the user's request using the smallest COMPLETE set of machine actions.

CORE BEHAVIOR: INSPECT -> RECONCILE -> MODIFY -> VERIFY.
${pageState}
- Inspect the current structure and exact IDs before adding anything.
- EDIT or REUSE an existing block when it already serves the requested semantic role.
- ADD only roles genuinely missing from the desired final page.
- REMOVE obsolete/conflicting duplicates by exact ID when needed.
- Repeated prompts must be IDEMPOTENT. Do not stack another navbar, hero, product grid, pricing section, FAQ, testimonials, contact section, gallery, CTA, or equivalent semantic role.
- Different variants of the same role still count as duplicates. product-grid and product-grid-3 are both products.
- If the user explicitly asks for another/second/duplicate instance, add may set allowDuplicate:true.
- Think about the desired FINAL page first, then return only the diff required to reach it.
- A broad "build me a complete website" request must not collapse into one arbitrary block or one image. Produce the coherent page structure the request requires.
- For a complete business/landing website, cover appropriate roles such as navigation, hero, primary offering/content, social proof, conversion/contact, and supporting content when those roles are missing.
- When the user requests real images, image work is PART of the full plan, not the entire plan. Generate hero/product/gallery/supporting imagery where appropriate.

The user may prompt in ANY human language and ANY visual style. Keep page copy in the requested language, or the user's language when none is specified. Selection is never required.

Selected element, when present:
${selectedContext}

Existing live page structure and exact IDs:
${pageContext}

Current root role counts:
${roleCounts}

Available WonderBuild block types include:
${BLOCK_CATALOG}

Supported actions:
{"action":"add","ref":"products","block":{"type":"product-grid-3","props":{},"styles":{}},"target":"root"}
{"action":"edit","targetId":"EXISTING_ID","props":{"heading":"Featured drinks"},"styles":{"gap":"24px"}}
{"action":"remove","targetId":"EXISTING_ID"}
{"action":"generate_image","targetId":"EXISTING_ID","propPath":"products.0.image","prompt":"A photorealistic ceramic latte on a walnut cafe table","style":"warm editorial food photography","size":"1024x1024","alt":"Ceramic latte"}

OUTPUT CONTRACT:
- Return machine actions inside the markers below. Do not use markdown code fences.
- Single action: ---BUILDER_ACTION ... ---END
- Multi-action: ---BUILDER_ACTIONS ... ---END
- Broad page builds should normally use multiple actions.

Rules:
- Existing page state is the source of truth. Use exact IDs for edits/removals.
- Before EVERY add, check whether its semantic role already exists. If it does, edit/reuse it unless another instance was explicitly requested.
- Broad requests on NONEMPTY pages mean reconcile/upgrade the existing page, never append a second complete site.
- If changing block variants is necessary, remove the obsolete exact-ID block and add the replacement instead of keeping both.
- If the user explicitly asks for images, include generate_image actions. Do not substitute placeholder URLs.
- Use only block types from the catalog.
- Make content specific to the request. Never use Lorem ipsum, Placeholder, Sample, or generic fake copy.
- Keep props/styles plain JSON and CSS-in-JS camelCase.
- Never generate scripts, JS handlers, raw custom HTML, dangerouslySetInnerHTML, srcdoc, javascript: URLs, custom CSS, or webhook code.
- Do not claim work was built unless at least one valid machine action is returned.
- Keep any human explanation short.`;
}

function validateAction(value: unknown): BuilderAction | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.action !== 'string' || !VALID_ACTIONS.has(candidate.action as BuilderAction['action'])) return null;
  if (candidate.action === 'add') {
    if (!candidate.block || typeof candidate.block !== 'object' || Array.isArray(candidate.block)) return null;
    const block = candidate.block as Record<string, unknown>;
    if (typeof block.type !== 'string' || !block.type.trim()) return null;
  }
  if (candidate.action === 'generate_image' && (typeof candidate.prompt !== 'string' || !candidate.prompt.trim())) return null;
  return candidate as BuilderAction;
}

function parseActionPayload(value: unknown): BuilderAction[] {
  if (Array.isArray(value)) return value.map(validateAction).filter((action): action is BuilderAction => Boolean(action)).slice(0, 16);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.actions)) return record.actions.map(validateAction).filter((action): action is BuilderAction => Boolean(action)).slice(0, 16);
    const single = validateAction(value);
    return single ? [single] : [];
  }
  return [];
}

function tryParseActions(candidate: string): BuilderAction[] {
  try { return parseActionPayload(JSON.parse(candidate.trim())); } catch { return []; }
}

function extractActions(text: string): BuilderAction[] {
  const candidates: string[] = [];
  const multi = text.match(/---BUILDER_ACTIONS\s*([\s\S]*?)\s*---END/i); if (multi?.[1]) candidates.push(multi[1]);
  const single = text.match(/---BUILDER_ACTION\s*([\s\S]*?)\s*---END/i); if (single?.[1]) candidates.push(single[1]);
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi; let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = fenceRegex.exec(text))) if (fenceMatch[1]) candidates.push(fenceMatch[1]);
  candidates.push(text.trim());
  const firstArray = text.indexOf('['), lastArray = text.lastIndexOf(']'); if (firstArray >= 0 && lastArray > firstArray) candidates.push(text.slice(firstArray, lastArray + 1));
  const firstObject = text.indexOf('{'), lastObject = text.lastIndexOf('}'); if (firstObject >= 0 && lastObject > firstObject) candidates.push(text.slice(firstObject, lastObject + 1));
  for (const candidate of candidates) { const actions = tryParseActions(candidate); if (actions.length) return actions; }
  return [];
}

function stripActions(text: string) {
  return text.replace(/---BUILDER_ACTIONS\s*[\s\S]*?\s*---END/gi, '').replace(/---BUILDER_ACTION\s*[\s\S]*?\s*---END/gi, '').replace(/```(?:json)?\s*[\s\S]*?```/gi, '').trim();
}

function applyQuickLocalEdit(prompt: string, selected: CanvasElement | null): boolean {
  if (!selected || prompt.length > 240) return false;
  const lower = prompt.toLowerCase();
  const styles: Record<string, unknown> = {}, props: Record<string, unknown> = {};
  if (/\b(center|centered)\b/.test(lower)) styles.textAlign = 'center';
  if (/\b(bold|bolder)\b/.test(lower)) styles.fontWeight = '700';
  if (/\b(rounded|rounder)\b/.test(lower)) styles.borderRadius = '16px';
  if (/\b(full width|full-width)\b/.test(lower)) styles.width = '100%';
  if (/\b(bigger|larger)\b/.test(lower)) styles.fontSize = '48px';
  if (/\b(smaller)\b/.test(lower)) styles.fontSize = '18px';
  const wantsBackground = lower.includes('background');
  const colors: Array<[RegExp, string]> = [[/\bpurple\b/, '#8b5cf6'],[/\bblue\b/, '#3b82f6'],[/\bcyan\b/, '#22d3ee'],[/\bgreen\b/, '#22c55e'],[/\bwhite\b/, '#ffffff'],[/\bblack\b/, '#050816']];
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

async function requestAI(message: string): Promise<string> {
  const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || `AI request failed (${response.status})`);
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!text) throw new Error('AI returned an empty response');
  return text;
}

function buildRepairPrompt(userRequest: string, systemPrompt: string, malformedReply: string): string {
  return `Repair a WonderBuild planner response into valid machine actions.\n\nUSER REQUEST:\n${userRequest.slice(0, 3500)}\n\nCURRENT WONDERBUILD CONTRACT:\n${systemPrompt.slice(0, 9000)}\n\nMALFORMED OR NON-PARSEABLE RESPONSE:\n${malformedReply.slice(0, 6000)}\n\nReturn ONLY one valid WonderBuild machine-action envelope using ---BUILDER_ACTION or ---BUILDER_ACTIONS and closing ---END. Do not use markdown fences. Do not explain the repair. Preserve the user's intended full result. For a broad complete-site request, return the complete reconciled action set, not one arbitrary block.`;
}

export default function AIAssistantPanel() {
  const pages = useBuilderStore((state) => state.pages);
  const activePageId = useBuilderStore((state) => state.activePageId);
  const elements = useBuilderStore((state) => state.elements);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const selectElement = useBuilderStore((state) => state.selectElement);
  const activePage = pages.find((page) => page.id === activePageId);
  const selected = useMemo(() => findElement(elements, selectedId), [elements, selectedId]);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Tell me what to build or change. I will inspect what is already here, reconcile it into the requested result, and avoid duplicate stacking.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, loading]);

  const applyAction = useCallback(async (action: BuilderAction, refs: Map<string, string>): Promise<string | null> => {
    const store = useBuilderStore.getState();
    const currentSelected = findElement(store.elements, store.selectedId);
    if (action.action === 'remove') {
      const targetId = action.targetRef ? refs.get(action.targetRef) : action.targetId === 'selected' || !action.targetId ? currentSelected?.id : action.targetId;
      const target = findElement(store.elements, targetId || null); if (!target) return null;
      store.removeElement(target.id); return `Removed ${target.name}`;
    }
    if (action.action === 'edit') {
      const targetId = action.targetRef ? refs.get(action.targetRef) : action.targetId === 'selected' || !action.targetId ? currentSelected?.id : action.targetId;
      const target = findElement(store.elements, targetId || null); if (!target) return null;
      const props = sanitizeObject(action.props), styles = sanitizeObject(action.styles);
      if (Object.keys(props).length) store.updateElementProps(target.id, props);
      if (Object.keys(styles).length) store.updateElementStyles(target.id, styles);
      store.selectElement(target.id); return `Updated ${target.name}`;
    }
    if (action.action === 'generate_image') {
      const prompt = action.prompt.trim().slice(0, 4000); if (!prompt) return null;
      const style = typeof action.style === 'string' ? action.style.trim().slice(0, 500) : '';
      const size = typeof action.size === 'string' ? action.size.trim().slice(0, 40) : '';
      const imagePrompt = [prompt, style ? `Visual style: ${style}` : '', size ? `Composition/aspect target: ${size}` : ''].filter(Boolean).join('\n');
      const imageResponse = await fetch('/api/ai/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt, size: size || undefined, type: 'wonderbuild', workspaceId: useBuilderStore.getState().activePageId || 'builder' }) });
      const imageData = await imageResponse.json().catch(() => ({}));
      if (!imageResponse.ok || typeof imageData.imageUrl !== 'string' || !imageData.imageUrl) throw new Error(imageData.error || `Image generation failed (${imageResponse.status})`);
      const targetId = action.targetRef ? refs.get(action.targetRef) : action.targetId === 'selected' ? currentSelected?.id : action.targetId;
      const target = findElement(useBuilderStore.getState().elements, targetId || null);
      if (target) {
        const propPath = action.propPath?.trim() || inferImagePropPath(target); if (!propPath) throw new Error(`${target.name} does not expose a usable image property`);
        const nextProps = setNestedValue((target.props || {}) as Record<string, unknown>, propPath, imageData.imageUrl); if (!nextProps) throw new Error(`Could not write generated image to ${target.name}`);
        if (action.alt && ['src', 'image', 'imageUrl'].includes(propPath)) nextProps.alt = action.alt.slice(0, 300);
        store.updateElementProps(target.id, nextProps); store.selectElement(target.id); return `Generated image for ${target.name}`;
      }
      if (action.targetRef || action.targetId) throw new Error('The requested image target could not be found');
      const definition = findBlockDefinition('image'); if (!definition) return null;
      const element: CanvasElement = { id: `el-${Date.now()}-ai-image-${Math.random().toString(36).slice(2, 7)}`, type: definition.type, name: action.name?.slice(0, 80) || 'AI Image', icon: definition.icon, props: { ...definition.defaultProps, src: imageData.imageUrl, alt: action.alt?.slice(0, 300) || prompt.slice(0, 180) }, styles: { ...definition.defaultStyles, width: '100%' } };
      store.addElement(element); store.selectElement(element.id); return 'Generated AI Image';
    }
    const definition = findBlockDefinition(action.block.type); if (!definition) return null;
    const props = sanitizeObject(action.block.props), styles = sanitizeObject(action.block.styles), wantsRoot = action.target !== 'selected';
    if (wantsRoot && !action.allowDuplicate) {
      const reusable = findReusableRoot(store.elements, definition.type);
      if (reusable) {
        if (Object.keys(props).length) store.updateElementProps(reusable.id, props);
        if (Object.keys(styles).length) store.updateElementStyles(reusable.id, styles);
        if (action.ref?.trim()) refs.set(action.ref.trim().slice(0, 80), reusable.id);
        store.selectElement(reusable.id); return `Updated existing ${reusable.name}`;
      }
    }
    const element: CanvasElement = { id: `el-${Date.now()}-ai-${Math.random().toString(36).slice(2, 7)}`, type: definition.type, name: action.block.name?.slice(0, 80) || definition.name, icon: action.block.icon || definition.icon, props: { ...definition.defaultProps, ...props }, styles: { ...definition.defaultStyles, ...styles } };
    const parentId = action.target === 'selected' && currentSelected && acceptsChildren(currentSelected.type) ? currentSelected.id : undefined;
    store.addElement(element, parentId); store.selectElement(element.id); if (action.ref?.trim()) refs.set(action.ref.trim().slice(0, 80), element.id); return `Added ${element.name}`;
  }, []);

  const handleSend = useCallback(async (override?: string) => {
    const promptText = (override ?? input).trim(); if (!promptText || loading) return;
    setMessages((previous) => [...previous, { role: 'user', content: promptText }]); setInput(''); setLoading(true); setLastApplied(null);
    const liveStore = useBuilderStore.getState();
    const liveSelected = findElement(liveStore.elements, liveStore.selectedId);
    const livePage = liveStore.pages.find((page) => page.id === liveStore.activePageId);
    const systemPrompt = buildSystemPrompt(livePage?.name || 'Home', liveSelected, liveStore.elements);
    let remoteError = '';
    try {
      let reply = await requestAI(`User request:\n${promptText.slice(0, 3500)}\n\n${systemPrompt}`);
      let actions = extractActions(reply), repaired = false;
      if (!actions.length) { repaired = true; reply = await requestAI(buildRepairPrompt(promptText, systemPrompt, reply)); actions = extractActions(reply); }
      if (!actions.length) throw new Error('AI planner returned no valid Builder actions after one structured repair attempt');
      const refs = new Map<string, string>(), applied: string[] = [], actionErrors: string[] = [];
      for (const action of actions) {
        try { const result = await applyAction(action, refs); if (result) applied.push(result); }
        catch (error) { actionErrors.push(error instanceof Error ? error.message : 'Action failed'); }
      }
      if (!applied.length) throw new Error(actionErrors[0] || 'The validated Builder plan did not apply any changes');
      setLastApplied(`${applied.length} live change${applied.length === 1 ? '' : 's'} applied`);
      const explanation = stripActions(reply), repairNote = repaired ? ' I repaired the AI plan into valid Builder actions before applying it.' : '';
      const warning = actionErrors.length ? `\n\n${actionErrors.length} action${actionErrors.length === 1 ? '' : 's'} could not be applied: ${actionErrors[0]}` : '';
      setMessages((previous) => [...previous, { role: 'assistant', content: `${explanation || `Applied ${applied.length} live change${applied.length === 1 ? '' : 's'}.`}${repairNote}${warning}` }]);
      return;
    } catch (error) { remoteError = error instanceof Error ? error.message : 'AI request failed'; }
    finally { setLoading(false); }
    if (applyQuickLocalEdit(promptText, liveSelected)) {
      setLastApplied(`Updated ${liveSelected?.name || 'selected element'}`);
      setMessages((previous) => [...previous, { role: 'assistant', content: 'The AI planner failed, but this was a simple selected-element edit, so I applied it locally.' }]); return;
    }
    setMessages((previous) => [...previous, { role: 'assistant', content: `I could not safely apply that request. ${remoteError || 'No valid Builder action was returned.'} No fallback blocks were added.` }]);
  }, [applyAction, input, loading]);

  const runSuggestion = (suggestion: string) => { setInput(suggestion); void handleSend(suggestion); };

  return <div className="flex h-full w-full flex-col overflow-hidden bg-[#080d1b] text-white">
    <div className="shrink-0 border-b border-white/8 bg-gradient-to-b from-violet-500/[.07] to-transparent px-3 py-3">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10"><WandSparkles className="h-4 w-4 text-violet-200" /></span><div><div className="text-[13px] font-extrabold text-white">AI Assist</div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-violet-200/45">Validate + reconcile live builder</div></div></div><span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-500/[.07] px-2 py-1 text-[10px] font-extrabold text-emerald-200/80"><Check className="h-3 w-3" /> No random fallback blocks</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2"><div className="text-[10px] font-extrabold uppercase text-white/35">Page</div><div className="mt-0.5 truncate text-[12px] font-bold text-white/75">{activePage?.name || 'Home'}</div></div><button type="button" onClick={() => selected && selectElement(selected.id)} className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2 text-left"><div className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-white/35"><MousePointer2 className="h-3 w-3" /> Optional target</div><div className={`mt-0.5 truncate text-[12px] font-bold ${selected ? 'text-violet-100/85' : 'text-white/30'}`}>{selected?.name || 'No selection needed'}</div></button></div>
    </div>
    <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-xl border px-3 py-2.5 text-[13px] font-semibold leading-5 ${message.role === 'user' ? 'border-violet-400/20 bg-violet-500/15 text-violet-50' : 'border-white/8 bg-white/[.04] text-white/80'}`}>{message.content}</div></div>)}{loading && <div className="inline-flex items-center gap-2 rounded-xl border border-violet-300/10 bg-violet-500/[.06] px-3 py-2 text-[13px] font-bold text-violet-100/70"><Sparkles className="h-4 w-4 animate-pulse" /> Planning, validating, and applying the complete page diff…</div>}</div>
    {lastApplied && <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-500/[.07] px-2.5 py-2 text-[11px] font-extrabold text-emerald-200/80"><Check className="h-3.5 w-3.5" /> {lastApplied}</div>}
    <div className="shrink-0 border-t border-white/8 p-3"><div className="mb-2 flex gap-1 overflow-x-auto pb-1">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => runSuggestion(suggestion)} disabled={loading} className="shrink-0 rounded-full border border-white/8 bg-white/[.03] px-2.5 py-1.5 text-[10px] font-extrabold text-white/45 hover:border-violet-300/20 hover:bg-violet-500/10 hover:text-violet-100 disabled:opacity-30">{suggestion}</button>)}</div><div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 focus-within:border-violet-400/35"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} rows={2} aria-label="Describe what WonderBuild should build or change" placeholder="Build, change, restyle, or fix anything…" className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] font-semibold leading-5 text-white outline-none placeholder:text-white/30" /><button type="button" onClick={() => void handleSend()} disabled={loading || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white disabled:opacity-35" aria-label="Send AI request">{loading ? <Bot className="h-4 w-4 animate-pulse" /> : <CornerDownLeft className="h-4 w-4" />}</button></div><p className="mt-1.5 text-center text-[10px] font-semibold text-white/25">Inspects first → validates the AI plan → repairs malformed output once → applies the complete diff.</p></div>
  </div>;
}
