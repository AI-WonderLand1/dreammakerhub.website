'use client';

import { ExternalLink, MousePointerClick, ScrollText } from 'lucide-react';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';

function findElement(elements: CanvasElement[], id: string | null): CanvasElement | null {
  if (!id) return null;
  for (const element of elements) {
    if (element.id === id) return element;
    const nested = findElement(element.children || [], id);
    if (nested) return nested;
  }
  return null;
}

function safeHref(value: string): string {
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

export default function InteractionPanel() {
  const elements = useBuilderStore((state) => state.elements);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const updateElementProps = useBuilderStore((state) => state.updateElementProps);
  const selected = findElement(elements, selectedId);

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center bg-[#080d1b] p-6 text-center text-[11px] leading-5 text-white/35">
        Select an element on the canvas to configure its click and scroll behavior.
      </div>
    );
  }

  const clickAction = String(selected.props?.clickAction || 'none');
  const hoverEffect = String(selected.props?.hoverEffect || 'none');
  const scrollEffect = String(selected.props?.scrollEffect || 'none');
  const setProp = (key: string, value: unknown) => updateElementProps(selected.id, { [key]: value });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080d1b] text-white">
      <div className="shrink-0 border-b border-white/8 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-500/10 text-violet-200">
            <MousePointerClick size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[.18em] text-violet-300/45">Selected element</p>
            <p className="truncate text-[11px] font-bold text-white/85">{selected.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <section className="rounded-xl border border-white/8 bg-white/[.025] p-3">
          <div className="mb-2 flex items-center gap-2">
            <MousePointerClick size={13} className="text-violet-300" />
            <h3 className="text-[10px] font-black uppercase tracking-[.12em] text-white/70">Click</h3>
          </div>
          <label className="block text-[9px] font-semibold text-white/35">Action</label>
          <select
            value={clickAction}
            onChange={(event) => setProp('clickAction', event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[10px] text-white outline-none focus:border-violet-400/40"
          >
            <option value="none">None</option>
            <option value="navigate">Open link</option>
            <option value="scroll-to">Scroll to section</option>
          </select>

          {clickAction === 'navigate' && (
            <div className="mt-3">
              <label className="flex items-center gap-1.5 text-[9px] font-semibold text-white/35">
                <ExternalLink size={10} /> URL or page path
              </label>
              <input
                value={String(selected.props?.clickUrl || '')}
                onChange={(event) => setProp('clickUrl', safeHref(event.target.value))}
                placeholder="/about or https://example.com"
                className="mt-1 h-9 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[10px] text-white outline-none placeholder:text-white/18 focus:border-violet-400/40"
              />
              <label className="mt-2 flex items-center gap-2 text-[9px] text-white/35">
                <input
                  type="checkbox"
                  checked={Boolean(selected.props?.clickNewTab)}
                  onChange={(event) => setProp('clickNewTab', event.target.checked)}
                  className="accent-violet-500"
                />
                Open external link in a new tab
              </label>
            </div>
          )}

          {clickAction === 'scroll-to' && (
            <div className="mt-3">
              <label className="flex items-center gap-1.5 text-[9px] font-semibold text-white/35">
                <ScrollText size={10} /> Section ID
              </label>
              <input
                value={String(selected.props?.scrollTarget || '')}
                onChange={(event) => setProp('scrollTarget', event.target.value.replace(/[^a-zA-Z0-9_:-]/g, ''))}
                placeholder="contact"
                className="mt-1 h-9 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[10px] text-white outline-none placeholder:text-white/18 focus:border-violet-400/40"
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-white/8 bg-white/[.025] p-3">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-white/70">Hover</h3>
          <select
            value={hoverEffect}
            onChange={(event) => setProp('hoverEffect', event.target.value)}
            className="h-9 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[10px] text-white outline-none focus:border-violet-400/40"
          >
            <option value="none">None</option>
            <option value="lift">Lift</option>
            <option value="scale">Scale</option>
            <option value="glow">Glow</option>
            <option value="underline">Underline</option>
          </select>
        </section>

        <section className="rounded-xl border border-white/8 bg-white/[.025] p-3">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-white/70">On scroll</h3>
          <select
            value={scrollEffect}
            onChange={(event) => setProp('scrollEffect', event.target.value)}
            className="h-9 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[10px] text-white outline-none focus:border-violet-400/40"
          >
            <option value="none">None</option>
            <option value="fade-in">Fade in</option>
            <option value="slide-up">Slide up</option>
          </select>
          <p className="mt-2 text-[9px] leading-4 text-white/25">These effects are stored on the same element and are applied on the published site.</p>
        </section>
      </div>
    </div>
  );
}
