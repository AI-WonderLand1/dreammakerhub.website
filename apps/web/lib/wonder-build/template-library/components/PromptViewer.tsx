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
  FileCheck2,
  ArrowRight,
  ExternalLink,
  Eye,
  Rocket,
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

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(batch.promptText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 space-y-6">
      {/* Sub-page Category Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
              Batch #{batch.batchNumber}
            </span>
            <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              Category: {batch.category}
            </span>
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {batch.variants.length} Variants
            </span>
          </div>

          <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
            {batch.category} Suite Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {batch.description} Select any layout variant below to view, customize, and edit in the live Visual Renderer.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-copy-prompt-batch-view"
            onClick={handleCopyPrompt}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-md ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Prompt' : 'Copy Batch Prompt'}</span>
          </button>

          <button
            id="btn-run-gemini-subpage"
            onClick={() => onRunBatchAi(batch)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate via Gemini</span>
          </button>
        </div>
      </div>

      {/* Required Variant Layouts Gallery - Each with a Thumbnail & Hover Effect */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Batch #{batch.batchNumber} Variant Templates ({batch.variants.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Click any card to open in Preview</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {batch.variants.map((variantName, idx) => {
            const matchedTemplate = associatedTemplates.find(
              (t) =>
                t.variant?.toLowerCase() === variantName.toLowerCase() ||
                t.name.toLowerCase().includes(variantName.toLowerCase())
            );

            return (
              <div
                key={idx}
                onClick={() => {
                  if (matchedTemplate) {
                    onSelectTemplateToView(matchedTemplate);
                  } else {
                    onRunBatchAi(batch);
                  }
                }}
                className={`group bg-slate-950 rounded-xl border p-3 space-y-2.5 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 ${
                  matchedTemplate
                    ? 'border-slate-800 hover:border-indigo-500/80'
                    : 'border-slate-800/80 hover:border-purple-500/60'
                }`}
              >
                {/* Thumbnail Image / SVG Mockup */}
                <TemplateThumbnail
                  template={matchedTemplate}
                  title={variantName}
                  category={batch.category}
                  badgeText={`Variant #${idx + 1}`}
                  aspectRatio="aspect-video"
                  showHoverOverlay={true}
                  className="w-full rounded-lg"
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-slate-500">Variant #{idx + 1}</span>
                    {matchedTemplate ? (
                      <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Ready
                      </span>
                    ) : (
                      <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        AI Preset
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors capitalize line-clamp-1">
                    {variantName}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {matchedTemplate?.description || `${batch.category} - ${variantName} responsive structure.`}
                  </p>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{matchedTemplate ? 'Open Preview' : 'Generate Layout'}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loaded Custom Templates Section if any */}
      {associatedTemplates.length > 0 && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Loaded Suite Presets ({associatedTemplates.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Ready for editing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associatedTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelectTemplateToView(template)}
                className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/80 rounded-xl overflow-hidden transition-all cursor-pointer p-3 space-y-2.5 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <TemplateThumbnail
                  template={template}
                  aspectRatio="aspect-video"
                  badgeText={
                    template.isCreatorTemplate
                      ? `Creator ${template.price ? `$${template.price}` : 'Free'}`
                      : template.variant || 'Preset'
                  }
                  showHoverOverlay={true}
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {template.name}
                    </h4>
                    {template.price !== undefined && (
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                        {template.price === 0 ? 'FREE' : `$${template.price}`}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {template.description}
                  </p>

                  {template.author && (
                    <div className="flex items-center space-x-1.5 pt-1">
                      <img
                        src={template.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(template.author.name)}`}
                        alt={template.author.name}
                        className="w-4 h-4 rounded-full border border-slate-700"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">
                        By {template.author.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live Preview & Customize</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
