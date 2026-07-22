'use client';

import React from 'react';
import { useBuilderStore } from '../store';

export default function InspectorPanel() {
  const { elements, selectedId, updateElementProps, updateElementStyles } = useBuilderStore();
  const selectedElement = elements.find((el) => el.id === selectedId);

  if (!selectedElement) {
    return (
      <div className="w-80 border-l border-white/10 bg-[#0c101d] p-4 text-white/50 text-sm flex items-center justify-center text-center">
        Select an element on the canvas to inspect its properties and styles.
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-white/10 bg-[#0c101d] p-4 text-white flex flex-col gap-6 overflow-y-auto">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-3">Element Inspector</h3>
        <p className="text-sm font-semibold">{selectedElement.name}</p>
        <span className="text-xs text-white/40 font-mono">ID: {selectedElement.id}</span>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">Properties</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/70 block mb-1">Content / Title</label>
            <input
              type="text"
              value={selectedElement.props.content || selectedElement.props.title || ''}
              onChange={(e) => updateElementProps(selectedElement.id, { content: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">Styles</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/70 block mb-1">Background Color</label>
            <input
              type="text"
              value={selectedElement.styles.backgroundColor || ''}
              onChange={(e) => updateElementStyles(selectedElement.id, { backgroundColor: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
