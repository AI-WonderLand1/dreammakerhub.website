'use client';
import React, { useState } from 'react';
import { BatchDefinition, WonderBuildTemplate } from '../types';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, Copy, Terminal } from 'lucide-react';

interface AiGeneratorModalProps {
  batch: BatchDefinition;
  isOpen: boolean;
  onClose: () => void;
  onGeneratedSuccess: (newTemplates: WonderBuildTemplate[]) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  batch,
  isOpen,
  onClose,
  onGeneratedSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRunBatchGemini = async () => {
    setLoading(true);
    setError(null);
    setGeneratedCount(null);

    try {
      const response = await fetch('/api/wonder-build/template-library/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: batch.category,
          variants: batch.variants,
          batchPrompt: batch.promptText,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate templates from server.');
      }

      if (Array.isArray(data.templates) && data.templates.length > 0) {
        setGeneratedCount(data.templates.length);
        onGeneratedSuccess(data.templates);
      } else {
        throw new Error('Server returned empty templates array.');
      }
    } catch (err: any) {
      console.error('Gemini batch generation error:', err);
      setError(err.message || 'Error executing batch prompt with Gemini API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Run Batch #{batch.batchNumber} with Gemini AI
              </h3>
              <p className="text-xs text-slate-400">
                Category: {batch.category} ({batch.count} Templates)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Variants ({batch.variants.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {batch.variants.map((v, i) => (
                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
                  {v}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Generation Failed</p>
                <p className="mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {generatedCount !== null && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-200">
                  Successfully Generated {generatedCount} Templates!
                </p>
                <p className="mt-0.5 text-emerald-400/80">
                  Added directly to Master Collection & Visual Renderer.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Clicking run will send Batch #{batch.batchNumber}'s prompt block to Gemini 3.6 Flash via server-side API. The generated JSON array will be validated and appended to your active suite.
          </p>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleRunBatchGemini}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Batch #{batch.batchNumber}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
