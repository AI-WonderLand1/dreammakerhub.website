"use client";
import React from "react";
// Import your components
import { Layout, Box, Layers, Palette, Play, Sparkles } from "lucide-react";

export default function FramerStyleBuilder() {
  return (
    /* The Shell: Prevents the whole browser from scrolling */
    <div className="fixed inset-0 flex flex-col bg-[#050505] text-white overflow-hidden">
      
      {/* 1. TOP NAV (Locked) */}
      <header className="h-14 border-b border-white/10 bg-[#0d0d0d] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
           <span className="font-black tracking-tighter text-xl">WONDERLAND</span>
           <div className="h-4 w-[1px] bg-white/10" />
           <span className="text-[10px] text-white/40 uppercase tracking-widest">Project: Alpha</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white/5 hover:bg-white/10 p-2 rounded-lg"><Play size={16}/></button>
          <button className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-[11px] font-bold uppercase">Publish</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. LEFT PANEL (The "Insert" Menu - Locked) */}
        <aside className="w-60 border-r border-white/10 bg-[#0d0d0d] flex flex-col shrink-0 z-40">
           <div className="p-4 border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30 font-bold">Layers</div>
           <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {/* Drag and Drop Sources Go Here */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/50 cursor-grab active:cursor-grabbing flex items-center gap-3">
                 <Box size={16} className="text-cyan-500" />
                 <span className="text-xs">Container</span>
              </div>
           </div>
        </aside>

        {/* 3. THE VIEWPORT (The "Framer" Canvas Area) */}
        <main className="flex-1 bg-[#111] relative overflow-auto flex items-start justify-center p-20 custom-scrollbar">
          
          {/* AI OVERLAY (Floating but static in view) */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
             <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center px-4 shadow-2xl">
                <Sparkles size={16} className="text-cyan-500 mr-2" />
                <input className="bg-transparent border-none outline-none text-xs flex-1" placeholder="AI Build Command..." />
             </div>
          </div>

          {/* THE ACTUAL WHITE CANVAS (Where the site is built) */}
          <div className="w-[1200px] min-h-[1600px] bg-white rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] origin-top transform scale-100">
             {/* This is where GrapesJS or your custom builder renders */}
          </div>

        </main>
      </div>
    </div>
  );
}

