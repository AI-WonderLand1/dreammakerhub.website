'use client';
import React, { useState } from 'react';
import {
  Rocket,
  X,
  CheckCircle2,
  ExternalLink,
  Globe,
  Copy,
  Check,
  Palette,
} from 'lucide-react';
import { copyToClipboard } from '../utils/templateUtils';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplateName?: string;
  totalTemplatesCount?: number;
  /** When set, the primary action opens the template in the WonderBuild canvas instead of the legacy fake deploy. */
  onOpenInBuilder?: () => void;
  builderLoading?: boolean;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  activeTemplateName = 'Modern SaaS Platform',
  totalTemplatesCount = 60,
  onOpenInBuilder,
  builderLoading = false,
}) => {
  const [deployStep, setDeployStep] = useState<'idle' | 'deploying' | 'success'>('idle');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dreammakerhub.website';
  const liveUrl = `${origin}/wonder-build/builder?template=${encodeURIComponent(activeTemplateName)}`;

  const handleStartDeploy = () => {
    setDeployStep('deploying');
    setTimeout(() => {
      setDeployStep('success');
    }, 2000);
  };

  const handleCopyUrl = async () => {
    const ok = await copyToClipboard(liveUrl);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Deploy Production Applet</h3>
              <p className="text-xs text-slate-400">
                Publishing active template & batch orchestrator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {deployStep === 'idle' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Template:</span>
                  <span className="text-xs font-bold text-indigo-400 font-mono">
                    {activeTemplateName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Compiled Blocks:</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {totalTemplatesCount} Sources Ready
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Editor:</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    WonderBuild Canvas
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 bg-indigo-950/20 border border-indigo-500/20 p-3.5 rounded-xl">
                <div className="flex items-center space-x-2 font-bold text-indigo-300">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Open in the Builder, then publish</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Seeds a new project with this template inside the drag-and-drop canvas, where you can keep editing and
                  publish to a live page.
                </p>
              </div>

              {onOpenInBuilder ? (
                <button
                  onClick={onOpenInBuilder}
                  disabled={builderLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {builderLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Creating project...</span>
                    </>
                  ) : (
                    <>
                      <Palette className="w-4 h-4" />
                      <span>Open in Builder</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStartDeploy}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 text-sm transition-all cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Confirm & Deploy Now</span>
                </button>
              )}
            </div>
          )}

          {deployStep === 'deploying' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-indigo-400" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Bundling & Deploying...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Optimizing CSS theme tokens, components tree, and batch manifests
                </p>
              </div>
            </div>
          )}

          {deployStep === 'success' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Successfully Deployed!</h4>
                <p className="text-xs text-emerald-300">
                  Your application suite and visual builder are live on the production network.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Applet Production URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className={`p-2.5 rounded-lg border font-semibold text-xs flex items-center space-x-1 cursor-pointer transition-all ${
                      copiedUrl
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                    }`}
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open Live URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={onClose}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
