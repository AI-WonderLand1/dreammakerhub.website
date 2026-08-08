'use client';
import React, { useState } from 'react';
import { BATCH_DEFINITIONS } from '../data/batchPrompts';
import { BatchDefinition, WonderBuildTemplate } from '../types';
import { copyToClipboard } from '../utils/templateUtils';
import { TemplateThumbnail } from './TemplateThumbnail';
import {
  Copy,
  Check,
  Search,
  Sparkles,
  Terminal,
  FileCode,
  Eye,
  ArrowRight,
} from 'lucide-react';

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
    <div className="bg-slate-900 border-r border-slate-800 w-full lg:w-80 xl:w-96 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white flex items-center space-x-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>{BATCH_DEFINITIONS.length} Prompt Batches</span>
          </h2>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">
            {BATCH_DEFINITIONS.reduce((sum, b) => sum + b.variants.length, 0)} Layouts
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            id="batch-search-input"
            type="text"
            placeholder="Filter category or layout..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Batch Cards List - Compact structure so 4+ fit on screen */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredBatches.map((batch) => {
          const isSelected = selectedBatchNumber === batch.batchNumber;
          const isCopied = copiedBatchNum === batch.batchNumber;

          // Find templates matching this batch category
          const matchingTemplates = templates.filter(
            (t) => t.category.toLowerCase() === batch.category.toLowerCase()
          );

          // Get lead template for thumbnail
          const leadTemplate = matchingTemplates[0];

          return (
            <div
              key={`batch-${batch.batchNumber}`}
              id={`batch-card-${batch.batchNumber}`}
              onClick={() => onSelectBatch(batch)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group relative ${
                isSelected
                  ? 'bg-slate-800/95 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Compact Thumbnail Container with Hover Effect */}
                <div
                  className="w-24 shrink-0 relative group/thumb"
                  title="Click to preview template"
                  onClick={(e) => {
                    if (leadTemplate && onSelectTemplateToPreview) {
                      e.stopPropagation();
                      onSelectTemplateToPreview(leadTemplate);
                    }
                  }}
                >
                  <TemplateThumbnail
                    template={leadTemplate}
                    title={batch.category}
                    category={batch.category}
                    badgeText={`#${batch.batchNumber}`}
                    aspectRatio="aspect-[4/3]"
                    showHoverOverlay={true}
                    className="w-full rounded-md shadow-sm"
                  />
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 truncate">
                      Batch #{batch.batchNumber}
                    </span>

                    {/* Copy Button */}
                    <button
                      id={`btn-copy-batch-${batch.batchNumber}`}
                      onClick={(e) => handleCopyPrompt(e, batch)}
                      title="Copy Prompt Block"
                      className={`p-1 rounded border transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors truncate">
                    {batch.category}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-tight">
                    {batch.description}
                  </p>

                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {batch.count} Variants
                    </span>

                    {leadTemplate && onSelectTemplateToPreview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplateToPreview(leadTemplate);
                        }}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action bar on active selection */}
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-300 font-medium flex items-center space-x-1">
                    <FileCode className="w-3 h-3" />
                    <span>Active Batch</span>
                  </span>

                  <button
                    id={`btn-run-batch-ai-${batch.batchNumber}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunBatchAi(batch);
                    }}
                    className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI Generator</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
