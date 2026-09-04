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
  FolderOpen,
  ArrowRight,
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
  totalTemplatesCount,
  readyBatchesCount,
  onOpenAiModal,
  onOpenCreatorStudio,
  onOpenImageStudio,
  onOpenSearchGrounding,
  onOpenVoiceCoPilot,
  onOpenIntelligence,
}) => {
  return (
    <header className="wb-template-nav sticky top-0 z-50 border-b text-white">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-[0_0_28px_rgba(124,58,237,.34)]">
            <Layers className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#060a17] bg-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[16px] font-black tracking-tight">WonderBuild</span>
              <span className="hidden rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[.18em] text-violet-200 xl:inline">Step 1 · Start</span>
            </div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[.16em] text-white/30 sm:block">{totalTemplatesCount} templates · {readyBatchesCount} collections</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center rounded-2xl border border-white/10 bg-black/30 p-1.5 shadow-inner shadow-black/30">
            <button id="nav-btn-prompts" onClick={() => setActiveTab('prompts')} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${activeTab === 'prompts' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_24px_rgba(124,58,237,.28)]' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>
              <Terminal className="h-3.5 w-3.5" /><span>Templates</span>
            </button>
            <button id="nav-btn-visual-builder" onClick={() => setActiveTab('visual-builder')} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${activeTab === 'visual-builder' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_24px_rgba(124,58,237,.28)]' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>
              <Eye className="h-3.5 w-3.5" /><span>Quick Preview</span>
            </button>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-white/15" />
          <div className="rounded-xl border border-white/8 bg-white/[.035] px-3 py-2 text-[10px] text-white/35">Customize opens <span className="font-bold text-cyan-300">Build</span></div>
        </div>

        <div className="flex items-center gap-1.5">
          <a href="/dashboard/projects" title="My Projects" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[.035] text-white/45 transition hover:border-violet-300/25 hover:bg-violet-500/10 hover:text-white md:flex">
            <FolderOpen className="h-4 w-4" />
          </a>
          {onOpenVoiceCoPilot && <button id="btn-voice-copilot" onClick={onOpenVoiceCoPilot} title="Voice co-pilot" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[.06] text-emerald-300 transition hover:bg-emerald-400/10 xl:flex"><Mic className="h-4 w-4" /></button>}
          {onOpenSearchGrounding && <button id="btn-search-grounding" onClick={onOpenSearchGrounding} title="Web research" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[.06] text-blue-300 transition hover:bg-blue-400/10 xl:flex"><Globe className="h-4 w-4" /></button>}
          {onOpenImageStudio && <button id="btn-image-studio" onClick={onOpenImageStudio} title="Image studio" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-fuchsia-400/15 bg-fuchsia-400/[.06] text-fuchsia-300 transition hover:bg-fuchsia-400/10 xl:flex"><ImageIcon className="h-4 w-4" /></button>}
          {onOpenIntelligence && <button id="btn-gemini-intelligence" onClick={onOpenIntelligence} title="AI UX audit" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[.06] text-amber-300 transition hover:bg-amber-400/10 2xl:flex"><Zap className="h-4 w-4" /></button>}
          <button id="btn-creator-studio" onClick={onOpenCreatorStudio} className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2 text-xs font-bold text-white/65 transition hover:bg-white/10 hover:text-white sm:flex"><Store className="h-3.5 w-3.5" /><span>Creator</span></button>
          <button id="btn-open-ai-modal" onClick={onOpenAiModal} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-3.5 py-2 text-xs font-black text-white shadow-[0_10px_30px_rgba(124,58,237,.28)] transition hover:-translate-y-0.5"><Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">Generate AI</span><span className="sm:hidden">AI</span></button>
        </div>
      </div>
    </header>
  );
};
