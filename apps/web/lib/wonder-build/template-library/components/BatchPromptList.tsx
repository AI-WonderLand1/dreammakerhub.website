'use client';
import React, { useState } from 'react';
import { BATCH_DEFINITIONS } from '../data/batchPrompts';
import { BatchDefinition, WonderBuildTemplate } from '../types';
import { copyToClipboard } from '../utils/templateUtils';
import { TemplateThumbnail } from './TemplateThumbnail';
import { Copy, Check, Search, Sparkles, Terminal, FileCode, Eye } from 'lucide-react';

interface BatchPromptListProps {
  selectedBatchNumber: number;
  onSelectBatch: (batch: BatchDefinition) => void;
  onRunBatchAi: (batch: BatchDefinition) => void;
  onSelectTemplateToPreview?: (template: WonderBuildTemplate) => void;
  templates?: WonderBuildTemplate[];
}

export const BatchPromptList: React.FC<BatchPromptListProps> = ({
  selectedBatchNumber,
  onSelectBatch,
  onRunBatchAi,
  onSelectTemplateToPreview,
  templates = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBatchNum, setCopiedBatchNum] = useState<number | null>(null);

  const filteredBatches = BATCH_DEFINITIONS.filter(
    (b) =>
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.variants.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `batch ${b.batchNumber}`.includes(searchQuery.toLowerCase())
  );

  const handleCopyPrompt = async (e: React.MouseEvent, batch: BatchDefinition) => {
    e.stopPropagation();
    const success = await copyToClipboard(batch.promptText);
    if (success) {
      setCopiedBatchNum(batch.batchNumber);
      setTimeout(() => setCopiedBatchNum(null), 2000);
    }
  };

  return (
    <aside className="wb-template-sidebar flex h-[calc(100vh-4.5rem)] w-full flex-col border-r lg:w-80 xl:w-96">
      <div className="space-y-3 border-b border-white/8 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-violet-300/55">Explore</p>
            <h2 className="mt-1 flex items-center gap-2 text-sm font-black text-white"><Terminal className="h-4 w-4 text-violet-300" />Template Collections</h2>
          </div>
          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-black text-violet-200">{BATCH_DEFINITIONS.reduce((sum, b) => sum + b.variants.length, 0)} layouts</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/25" />
          <input id="batch-search-input" type="text" placeholder="Search styles or industries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-violet-400/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,.07)]" />
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {filteredBatches.map((batch) => {
          const isSelected = selectedBatchNumber === batch.batchNumber;
          const isCopied = copiedBatchNum === batch.batchNumber;
          const matchingTemplates = templates.filter((t) => t.category.toLowerCase() === batch.category.toLowerCase());
          const leadTemplate = matchingTemplates[0];

          return (
            <div key={`batch-${batch.batchNumber}`} id={`batch-card-${batch.batchNumber}`} onClick={() => onSelectBatch(batch)} className={`wb-template-card group cursor-pointer rounded-2xl border p-3 transition ${isSelected ? 'ring-1 ring-violet-400/45 shadow-[0_16px_44px_rgba(76,29,149,.24)]' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="relative w-24 shrink-0" title="Customize template" onClick={(e) => { if (leadTemplate && onSelectTemplateToPreview) { e.stopPropagation(); onSelectTemplateToPreview(leadTemplate); } }}>
                  <TemplateThumbnail template={leadTemplate} title={batch.category} category={batch.category} badgeText={`#${batch.batchNumber}`} aspectRatio="aspect-[4/3]" showHoverOverlay className="w-full" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-violet-400/15 bg-violet-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[.14em] text-violet-200">Collection {batch.batchNumber}</span>
                    <button id={`btn-copy-batch-${batch.batchNumber}`} onClick={(e) => handleCopyPrompt(e, batch)} title="Copy prompt" className={`rounded-lg border p-1.5 transition ${isCopied ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/8 bg-white/[.035] text-white/30 hover:text-white'}`}>{isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button>
                  </div>
                  <h3 className="mt-2 truncate text-[13px] font-black text-white transition group-hover:text-violet-200">{batch.category}</h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{batch.description}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-white/6 pt-2">
                    <span className="text-[9px] font-semibold text-white/25">{batch.count} variants</span>
                    {leadTemplate && onSelectTemplateToPreview && <button onClick={(e) => { e.stopPropagation(); onSelectTemplateToPreview(leadTemplate); }} className="flex items-center gap-1 text-[9px] font-bold text-cyan-300/75 transition hover:text-cyan-200"><Eye className="h-2.5 w-2.5" />Customize</button>}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-violet-400/12 bg-violet-500/[.065] px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.12em] text-violet-200"><FileCode className="h-3 w-3" />Selected</span>
                  <button id={`btn-run-batch-ai-${batch.batchNumber}`} onClick={(e) => { e.stopPropagation(); onRunBatchAi(batch); }} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-2.5 py-1.5 text-[9px] font-black text-white shadow-[0_8px_20px_rgba(124,58,237,.2)]"><Sparkles className="h-3 w-3" />Generate AI</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
