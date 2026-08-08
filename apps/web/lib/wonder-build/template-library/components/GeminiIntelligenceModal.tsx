'use client';
import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  BarChart2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wand2,
  ArrowRight,
  ShieldCheck,
  Type,
} from 'lucide-react';
import { WonderBuildTemplate, WonderBuildElement } from '../types';

interface GeminiIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: WonderBuildTemplate;
  onUpdateTemplate?: (updated: WonderBuildTemplate) => void;
}

export const GeminiIntelligenceModal: React.FC<GeminiIntelligenceModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onUpdateTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'fast-copy' | 'ux-audit'>('fast-copy');

  // Fast Copy State (gemini-3.1-flash-lite)
  const [fastPrompt, setFastPrompt] = useState('Rewrite hero heading to be punchy, high-converting, and clear for a SaaS startup');
  const [fastResult, setFastResult] = useState<string | null>(null);
  const [isFastLoading, setIsFastLoading] = useState(false);

  // UX Audit State (gemini-3.1-pro-preview)
  const [auditData, setAuditData] = useState<{
    score?: number;
    strengths?: string[];
    recommendations?: string[];
    headlineImprovements?: Array<{ original: string; suggested: string; reason: string }>;
  } | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Fast Task (gemini-3.1-flash-lite)
  const handleRunFastTask = async () => {
    if (!fastPrompt.trim()) return;
    setIsFastLoading(true);
    setFastResult(null);

    try {
      const res = await fetch('/api/wonder-build/template-library/fast-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fastPrompt,
          context: `Current Template: ${currentTemplate.name} (${currentTemplate.category})`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fast task execution failed');
      }

      setFastResult(data.result);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Fast task error');
    } finally {
      setIsFastLoading(false);
    }
  };

  // Handle Deep UX Audit (gemini-3.1-pro-preview)
  const handleRunUXAudit = async () => {
    setIsAuditLoading(true);
    setAuditData(null);

    try {
      const res = await fetch('/api/wonder-build/template-library/complex-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: currentTemplate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Complex analysis failed');
      }

      setAuditData(data.analysis);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'UX Audit error');
    } finally {
      setIsAuditLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Gemini Intelligence Suite</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Multi-Model Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fast micro-task transformations with Flash Lite & deep design reasoning with Gemini 3.1 Pro.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('fast-copy')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'fast-copy'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Fast Micro-Copy Generator (gemini-3.1-flash-lite)</span>
          </button>

          <button
            onClick={() => setActiveTab('ux-audit')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'ux-audit'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Deep UX & Layout Audit (gemini-3.1-pro-preview)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeTab === 'fast-copy' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-amber-400" />
                  Instant Text & Headline Transformer
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fastPrompt}
                    onChange={(e) => setFastPrompt(e.target.value)}
                    placeholder="Enter micro-copy task e.g. Write 3 high converting CTA button labels"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleRunFastTask}
                    disabled={isFastLoading}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    {isFastLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Run Fast Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {fastResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4" />
                    Generated Copy Options
                  </h4>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono">
                    {fastResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ux-audit' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="font-bold text-sm text-white">Template UX & Conversion Rate Audit</h4>
                  <p className="text-xs text-slate-400">
                    Evaluates visual hierarchy, readability, CTA contrast, and layout structure of {currentTemplate.name}.
                  </p>
                </div>
                <button
                  onClick={handleRunUXAudit}
                  disabled={isAuditLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAuditLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Run Deep Audit</span>
                    </>
                  )}
                </button>
              </div>

              {auditData && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Score */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Overall Conversion & UX Rating
                      </span>
                      <div className="text-3xl font-black text-white mt-1">
                        {auditData.score || 88} <span className="text-sm font-normal text-slate-500">/ 100</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/80 flex items-center justify-center font-black text-amber-400 text-xl bg-amber-500/10">
                      {auditData.score || 88}%
                    </div>
                  </div>

                  {/* Strengths & Recommendations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Design Strengths
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {auditData.strengths?.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        )) || <li>Strong typography hierarchy and clean spacing.</li>}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Recommendations
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {auditData.recommendations?.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        )) || <li>Increase contrast on main CTA button for better visibility.</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
