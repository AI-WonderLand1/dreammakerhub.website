'use client';

import React from 'react';
import { useBuilderStore } from '../store';
import { Breakpoint } from '../types';

export default function ResponsiveControls() {
  const { activeBreakpoint, setBreakpoint, undo, redo, zoom, setZoom } = useBuilderStore();

  const breakpoints: Array<{ id: Breakpoint; label: string; icon: string }> = [
    { id: 'mobile', label: 'Mobile', icon: '📱' },
    { id: 'tablet', label: 'Tablet', icon: '📲' },
    { id: 'desktop', label: 'Desktop', icon: '💻' },
    { id: 'wide', label: 'Wide Screen', icon: '🖥️' },
  ];

  return (
    <div className="h-12 bg-[#0c101d] border-b border-white/10 px-4 flex items-center justify-between text-white select-none">
      <div className="flex items-center gap-1">
        {breakpoints.map((bp) => (
          <button
            key={bp.id}
            onClick={() => setBreakpoint(bp.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeBreakpoint === bp.id ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{bp.icon}</span>
            <span className="hidden sm:inline">{bp.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors text-xs"
          title="Undo"
        >
          ↩️
        </button>
        <button
          onClick={redo}
          className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors text-xs"
          title="Redo"
        >
          ↪️
        </button>
        <div className="h-4 w-[1px] bg-white/10 mx-1" />
        <span className="text-xs font-mono text-white/40">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
