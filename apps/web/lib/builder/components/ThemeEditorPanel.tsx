'use client';

import React from 'react';
import { useBuilderStore } from '../store';

export default function ThemeEditorPanel() {
  const { theme } = useBuilderStore();

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-white p-4 border-r border-white/10 w-80 overflow-y-auto space-y-6">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-3">Theme & Styles</h3>
        <p className="text-xs text-white/50">Global variables mapped to WordPress theme.json.</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">Color Palette</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(theme.colors).map(([name, hex]) => (
            <div key={name} className="p-2 rounded border border-white/10 bg-white/5 flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: hex }} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase text-white/60">{name}</p>
                <p className="text-xs font-mono text-white/90">{hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">Typography</h4>
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded border border-white/10 bg-white/5">
            <span className="text-white/40 block text-[10px] font-bold">HEADING FONT</span>
            <span className="font-mono">{theme.fonts.heading}</span>
          </div>
          <div className="p-2 rounded border border-white/10 bg-white/5">
            <span className="text-white/40 block text-[10px] font-bold">BODY FONT</span>
            <span className="font-mono">{theme.fonts.body}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
