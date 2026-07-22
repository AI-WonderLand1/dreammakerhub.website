'use client';

import React from 'react';
import { useBuilderStore } from '../store';

export default function LayersPanel() {
  const { elements, selectedId, selectElement, removeElement } = useBuilderStore();

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-white p-4 border-r border-white/10 w-72">
      <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-4">Layers & Structure</h3>

      {elements.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-xs text-white/30">
          No components added to page yet.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1">
          {elements.map((el, index) => (
            <div
              key={el.id}
              onClick={() => selectElement(el.id)}
              className={`p-2 rounded border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                selectedId === el.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-white/70 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white/30 font-mono text-[10px]">#{index + 1}</span>
                <span className="font-medium truncate">{el.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(el.id);
                }}
                className="text-white/30 hover:text-red-400 px-1 text-xs"
                title="Delete layer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
