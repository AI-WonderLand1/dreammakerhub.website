'use client';

import React from 'react';
import { useBuilderStore } from '../store';

export default function VisualBuilderCanvas() {
  const { elements, selectedId, selectElement, zoom, pan } = useBuilderStore();

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#090d16] text-white selection:bg-purple-500 selection:text-white"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        className="absolute inset-0 transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {elements.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              <p className="text-4xl mb-3">🎨</p>
              <h3 className="text-lg font-semibold text-purple-300">Infinite Builder Canvas</h3>
              <p className="text-sm text-white/50 mt-1">Drag and drop components from the library to build pages.</p>
            </div>
          </div>
        ) : (
          elements.map((el) => (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                selectElement(el.id);
              }}
              className={`p-4 my-2 rounded border cursor-pointer transition-all ${
                selectedId === el.id ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50' : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
              style={el.styles}
            >
              <span className="text-xs uppercase text-purple-400 font-bold block mb-1">{el.name}</span>
              <div>{el.props.content || el.props.title || el.name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
