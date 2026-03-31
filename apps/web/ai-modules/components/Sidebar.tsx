"use client";
import React from "react";
import { Plus, Trash2, Layout, Database, Ghost, Mic, Eye, Zap, HardDrive, Settings2 } from "lucide-react";
import { cn } from "../utils"; // Assuming you have a class-merge utility

interface SidebarProps {
  modules: any[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, updates: any) => void;
}

export function Sidebar({ modules, activeId, onSelect, onRemove, onAdd, onUpdate }: SidebarProps) {

  // Local function to toggle features inside the active module's config
  const toggleFeature = (featureKey: string) => {
    const activeModule = modules.find(m => m.id === activeId);
    if (!activeModule) return;

    const currentConfig = activeModule.config || {};
    onUpdate(activeId, {
      config: {
        ...currentConfig,
        [featureKey]: !currentConfig[featureKey]
      }
    });
  };

  const activeModule = modules.find(m => m.id === activeId);

  return (
    <div className="w-72 h-full flex flex-col border-r border-white/5 bg-black/80 backdrop-blur-3xl p-6 z-30 selection:bg-sky-500">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Ghost className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-black tracking-tighter text-lg uppercase italic text-white leading-none">
            Wonder.Lab
          </span>
          <span className="text-[8px] text-slate-500 font-mono tracking-[0.3em] uppercase mt-1">Sovereign_OS</span>
        </div>
      </div>

      {/* Primary Action */}
      <button 
        onClick={onAdd}
        className="flex items-center justify-center gap-2 w-full py-4 px-4 rounded-xl bg-white text-black font-black text-[10px] mb-8 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest shadow-xl shadow-white/5"
      >
        <Plus className="h-4 w-4" /> New Node
      </button>

      {/* Module Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/5" /> Active_Nodes
        </div>

        {modules.map((module) => (
          <div 
            key={module.id}
            onClick={() => onSelect(module.id)}
            className={cn(
              "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
              activeId === module.id 
                ? "bg-sky-500/10 border-sky-500/50 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
                : "bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              <Layout className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-tight">{module.label}</span>
            </div>
            <Trash2 
              onClick={(e) => { e.stopPropagation(); onRemove(module.id); }}
              className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition" 
            />
          </div>
        ))}
      </nav>

      {/* FEATURE TOGGLE DECK */}
      <div className="pt-6 border-t border-white/5 mt-auto">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">
          Control_Toggles
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <FeatureIconToggle 
            icon={<Zap />} label="Egyptian" active={activeModule?.config?.useEgyptian} 
            onClick={() => toggleFeature('useEgyptian')} 
          />
          <FeatureIconToggle 
            icon={<Mic />} label="Voice" active={activeModule?.config?.useVoice} 
            onClick={() => toggleFeature('useVoice')} 
          />
          <FeatureIconToggle 
            icon={<Eye />} label="Vision" active={activeModule?.config?.useVision} 
            onClick={() => toggleFeature('useVision')} 
          />
          <FeatureIconToggle 
            icon={<HardDrive />} label="BYOC" active={activeModule?.config?.useStorage} 
            onClick={() => toggleFeature('useStorage')} 
          />
        </div>

        {/* System Diagnostics */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">System_Live</span>
          </div>
          <p className="text-[9px] text-slate-600 leading-relaxed uppercase font-bold tracking-tighter">
            Storage: <span className="text-amber-500/80">Temp_24H</span>
            <br />
            BYOK_Security: <span className={activeModule?.config?.useBYOK ? "text-sky-500" : "text-slate-700"}>
              {activeModule?.config?.useBYOK ? "Active" : "Disabled"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Sub-component for clean toggle buttons
function FeatureIconToggle({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all",
        active 
          ? "bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-inner shadow-sky-500/5" 
          : "bg-white/5 border-white/5 text-slate-600 grayscale hover:grayscale-0 hover:border-white/10"
      )}
    >
      {React.cloneElement(icon, { className: "h-3.5 w-3.5" })}
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}