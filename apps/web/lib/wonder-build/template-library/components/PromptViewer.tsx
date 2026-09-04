'use client';
import React, { useState } from 'react';
import { BatchDefinition, WonderBuildTemplate } from '../types';
import { copyToClipboard } from '../utils/templateUtils';
import { TemplateThumbnail } from './TemplateThumbnail';
import {
  Copy,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  WandSparkles,
  MonitorSmartphone,
  Zap,
  Search,
} from 'lucide-react';

interface PromptViewerProps {
  batch: BatchDefinition;
  associatedTemplates: WonderBuildTemplate[];
  onSelectTemplateToView: (template: WonderBuildTemplate) => void;
  onRunBatchAi: (batch: BatchDefinition) => void;
}

export const PromptViewer: React.FC<PromptViewerProps> = ({
  batch,
  associatedTemplates,
  onSelectTemplateToView,
  onRunBatchAi,
}) => {
  const [copied, setCopied] = useState(false);
  const featuredTemplate = associatedTemplates[0];

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(batch.promptText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="wb-template-workspace flex-1 space-y-5 overflow-y-auto p-4 sm:p-5 lg:p-6">
      <section className="wb-template-section relative overflow-hidden rounded-[26px] border p-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-80 bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[.92fr_1.08fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-violet-200">Collection {batch.batchNumber}</span>
              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">{batch.variants.length} variations</span>
            </div>

            <h1 className="mt-4 max-w-xl text-3xl font-black tracking-[-.035em] text-white sm:text-4xl">{batch.category}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">{batch.description} Pick a direction, preview the design, then open it directly in Build mode for AI and drag-and-drop editing.</p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button onClick={() => onRunBatchAi(batch)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_32px_rgba(124,58,237,.24)] transition hover:-translate-y-0.5"><Sparkles className="h-3.5 w-3.5" />Generate with AI</button>
              <button onClick={handleCopyPrompt} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${copied ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[.04] text-white/55 hover:bg-white/[.07] hover:text-white'}`}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy AI prompt'}</button>
            </div>

            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2">
              {[
                [MonitorSmartphone, 'Responsive', 'Desktop → mobile'],
                [WandSparkles, 'AI ready', 'Generate + edit'],
                [Zap, 'Fast start', 'Open in Builder'],
              ].map(([Icon, title, sub]) => {
                const C = Icon as React.ElementType;
                return <div key={String(title)} className="rounded-xl border border-white/7 bg-black/20 p-3"><C className="h-3.5 w-3.5 text-violet-300" /><p className="mt-2 text-[10px] font-black text-white/70">{String(title)}</p><p className="mt-1 text-[9px] text-white/25">{String(sub)}</p></div>;
              })}
            </div>
          </div>

          <div className="relative min-h-[250px] rounded-[22px] border border-violet-400/15 bg-[#060a17]/75 p-3 shadow-[0_30px_80px_rgba(0,0,0,.36)]">
            <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
            {featuredTemplate ? (
              <button type="button" onClick={() => onSelectTemplateToView(featuredTemplate)} className="group block h-full w-full text-left">
                <TemplateThumbnail template={featuredTemplate} aspectRatio="aspect-[16/9]" badgeText="Featured" showHoverOverlay className="w-full" />
                <div className="mt-3 flex items-center justify-between px-1">
                  <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-300/60">Featured starting point</p><h3 className="mt-1 text-sm font-black text-white">{featuredTemplate.name}</h3></div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10 text-violet-200 transition group-hover:translate-x-0.5 group-hover:bg-violet-500/20"><ArrowRight className="h-4 w-4" /></span>
                </div>
              </button>
            ) : (
              <div className="flex h-full min-h-[230px] items-center justify-center rounded-2xl border border-dashed border-violet-400/15 bg-gradient-to-br from-violet-500/[.07] to-blue-500/[.04] text-center">
                <div><Sparkles className="mx-auto h-7 w-7 text-violet-300" /><p className="mt-3 text-sm font-black text-white/70">Generate this collection</p><p className="mt-1 text-[10px] text-white/30">AI will create the first visual layouts.</p></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="wb-template-section rounded-[24px] border p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300/50">Explore directions</p>
            <h2 className="mt-1 flex items-center gap-2 text-sm font-black text-white"><Layers className="h-4 w-4 text-violet-300" />{batch.category} designs</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-[10px] text-white/25 md:flex"><Search className="h-3 w-3" />Choose a card to preview or generate</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {batch.variants.map((variantName, idx) => {
            const matchedTemplate = associatedTemplates.find((t) => t.variant?.toLowerCase() === variantName.toLowerCase() || t.name.toLowerCase().includes(variantName.toLowerCase()));
            return (
              <button key={idx} type="button" onClick={() => matchedTemplate ? onSelectTemplateToView(matchedTemplate) : onRunBatchAi(batch)} className="wb-template-card group rounded-2xl border p-3 text-left">
                <TemplateThumbnail template={matchedTemplate} title={variantName} category={batch.category} badgeText={`Variant ${idx + 1}`} aspectRatio="aspect-[16/10]" showHoverOverlay className="w-full" />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${matchedTemplate ? 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.6)]' : 'bg-fuchsia-300 shadow-[0_0_8px_rgba(240,171,252,.55)]'}`} /><span className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">{matchedTemplate ? 'Ready' : 'AI preset'}</span></div><h3 className="mt-1.5 truncate text-[13px] font-black text-white transition group-hover:text-violet-200">{variantName}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/30">{matchedTemplate?.description || `${batch.category} — ${variantName} responsive visual direction.`}</p></div>
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[.035] text-white/30 transition group-hover:border-violet-300/25 group-hover:bg-violet-500/10 group-hover:text-violet-200"><ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2.5 text-[9px] font-bold text-white/25"><span className="flex items-center gap-1"><Eye className="h-3 w-3 text-cyan-300/60" />{matchedTemplate ? 'Customize in Builder' : 'Generate this design'}</span><span>{String(idx + 1).padStart(2, '0')}</span></div>
              </button>
            );
          })}
        </div>
      </section>

      {associatedTemplates.length > 1 && (
        <section className="wb-template-section rounded-[24px] border p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300/45">Ready now</p><h2 className="mt-1 text-sm font-black text-white">Loaded templates</h2></div><span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-2.5 py-1 text-[9px] font-black text-emerald-200">{associatedTemplates.length} ready</span></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {associatedTemplates.map((template) => (
              <button key={template.id} type="button" onClick={() => onSelectTemplateToView(template)} className="wb-template-card group rounded-2xl border p-3 text-left">
                <TemplateThumbnail template={template} aspectRatio="aspect-[16/9]" badgeText={template.variant || 'Preset'} showHoverOverlay />
                <div className="mt-3 flex items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-xs font-black text-white group-hover:text-violet-200">{template.name}</h3><p className="mt-1 line-clamp-1 text-[10px] text-white/30">{template.description}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-violet-300/60" /></div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
