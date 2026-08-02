'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useBuilderStore } from '../store';
import { BLOCKS, BLOCK_CATEGORIES } from '../blocks';
import type { BlockDefinition, BlockCategory, CanvasElement } from '../types';

function LibraryBlockItem({ block }: { block: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${block.type}`,
    data: { type: 'palette', block },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => useBuilderStore.getState().addElement(blockToElement(block))}
      className={`flex items-center gap-2.5 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5 cursor-grab active:cursor-grabbing transition-all group ${
        isDragging ? 'opacity-40' : ''
      }`}
      title={block.description}
    >
      <span className="text-lg shrink-0">{block.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white/80 truncate">{block.name}</p>
        <p className="text-[10px] text-white/30 truncate">{block.description}</p>
      </div>
      <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
    </div>
  );
}

function blockToElement(block: BlockDefinition): CanvasElement {
  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: block.type,
    name: block.name,
    icon: block.icon,
    props: { ...block.defaultProps },
    styles: { ...block.defaultStyles },
  };
}

export default function ComponentLibrary() {
  const { setLeftPanelOpen } = useBuilderStore();
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('forms');
  const [search, setSearch] = useState('');

  const filtered = BLOCKS.filter(
    (b) => b.category === activeCategory && (!search || b.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-[23.4rem] bg-[#0b0f19] text-white border-r border-white/10">
      <div className="shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Blocks ({BLOCKS.length})</h3>
          <button onClick={() => setLeftPanelOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1">✕</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks..."
          className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/20"
        />
      </div>

      <div className="shrink-0 flex overflow-x-auto gap-1 p-2 border-b border-white/10 flex-wrap">
        {BLOCK_CATEGORIES.map((cat) => {
          const count = BLOCKS.filter((b) => b.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                activeCategory === cat.key ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={`${count} blocks`}
            >
              {cat.icon} {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">No blocks found.</p>
        )}
        {filtered.map((block) => (
          <LibraryBlockItem key={block.type} block={block} />
        ))}
      </div>

      <div className="shrink-0 border-t border-white/10 p-2 text-center text-[10px] text-white/20">
        {BLOCKS.length} blocks · {BLOCK_CATEGORIES.length} categories
      </div>
    </div>
  );
}
