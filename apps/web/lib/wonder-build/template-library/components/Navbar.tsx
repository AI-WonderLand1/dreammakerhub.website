'use client';
import React from 'react';
import { ActiveTab } from '../types';
import {
  Layers,
  Eye,
  Sparkles,
  Terminal,
  Store,
  Globe,
  Mic,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalTemplatesCount: number;
  readyBatchesCount: number;
  onExportAll: () => void;
  onOpenAiModal: () => void;
  onOpenCreatorStudio: () => void;
  onOpenImageStudio?: () => void;
  onOpenSearchGrounding?: () => void;
  onOpenVoiceCoPilot?: () => void;
  onOpenIntelligence?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiModal,
  onOpenCreatorStudio,
  onOpenImageStudio,
  onOpenSearchGrounding,
  onOpenVoiceCoPilot,
  onOpenIntelligence,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                WonderBuild Start
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Step 1 of 3
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Templates and AI starting points — editing happens in Builder
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-btn-prompts"
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'prompts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>

          <button
            id="nav-btn-visual-builder"
            onClick={() => setActiveTab('visual-builder')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'visual-builder'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick Preview</span>
          </button>
        </nav>

        <div className="flex items-center space-x-1.5">
          {onOpenVoiceCoPilot && (
            <button
              id="btn-voice-copilot"
              onClick={onOpenVoiceCoPilot}
              title="Voice Conversation (Gemini Live API)"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Voice</span>
            </button>
          )}

          {onOpenSearchGrounding && (
            <button
              id="btn-search-grounding"
              onClick={onOpenSearchGrounding}
              title="Google Search Grounding"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Research</span>
            </button>
          )}

          {onOpenImageStudio && (
            <button
              id="btn-image-studio"
              onClick={onOpenImageStudio}
              title="Gemini Pro Image Studio"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden lg:inline">Images</span>
            </button>
          )}

          {onOpenIntelligence && (
            <button
              id="btn-gemini-intelligence"
              onClick={onOpenIntelligence}
              title="Gemini Intelligence & UX Audit"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">AI Audit</span>
            </button>
          )}

          <button
            id="btn-creator-studio"
            onClick={onOpenCreatorStudio}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Creator</span>
          </button>

          <button
            id="btn-open-ai-modal"
            onClick={onOpenAiModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
