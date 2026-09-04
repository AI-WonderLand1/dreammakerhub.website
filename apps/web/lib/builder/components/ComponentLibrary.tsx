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
      className={`wb-builder-library-item group flex cursor-grab items-center gap-3 rounded-xl border p-2.5 transition-all active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      title={block.description}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-gradient-to-br from-violet-500/10 to-blue-500/[.055] text-lg shadow-inner shadow-black/20">{block.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-black text-white/80 transition group-hover:text-white">{block.name}</p>
        <p className="mt-0.5 truncate text-[9px] text-white/25">{block.description}</p>
      </div>
      <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/8 bg-white/[.035] text-[10px] font-black text-white/20 opacity-0 transition group-hover:border-violet-300/20 group-hover:bg-violet-500/10 group-hover:text-violet-200 group-hover:opacity-100">+</span>
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

  const filtered = BLOCKS.filter((b) => b.category === activeCategory && (!search || b.name.toLowerCase().includes(search.toLowerCase())));
  const activeMeta = BLOCK_CATEGORIES.find((cat) => cat.key === activeCategory);

  return (
    <div className="wb-builder-library flex h-full w-[23.4rem] flex-col text-white">
      <div className="shrink-0 border-b border-white/8 p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300/45">Insert</p>
            <h3 className="mt-1 text-xs font-black text-white">Components <span className="text-white/25">{BLOCKS.length}</span></h3>
          </div>
          <button onClick={() => setLeftPanelOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/[.03] text-[10px] text-white/25 transition hover:text-white">✕</button>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything to insert..." className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white outline-none transition placeholder:text-white/20 focus:border-violet-400/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,.07)]" />
      </div>

      <div className="shrink-0 border-b border-white/8 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_CATEGORIES.map((cat) => {
            const count = BLOCKS.filter((b) => b.category === cat.key).length;
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`rounded-lg px-2 py-1.5 text-[9px] font-bold transition ${activeCategory === cat.key ? 'border border-violet-300/25 bg-violet-500/15 text-violet-100 shadow-[0_6px_18px_rgba(124,58,237,.12)]' : 'border border-transparent text-white/35 hover:bg-white/[.035] hover:text-white/65'}`} title={`${count} blocks`}>
                <span className="mr-1">{cat.icon}</span>{cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/25">{activeMeta?.icon} {activeMeta?.label}</div>
        <div className="rounded-full border border-white/8 bg-white/[.03] px-2 py-0.5 text-[8px] font-black text-white/25">{filtered.length} items</div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-2.5 pb-3">
        {filtered.length === 0 && <p className="py-8 text-center text-[10px] text-white/25">No components found.</p>}
        {filtered.map((block) => <LibraryBlockItem key={block.type} block={block} />)}
      </div>

      <div className="shrink-0 border-t border-white/8 bg-black/10 p-2.5 text-center text-[8px] font-semibold uppercase tracking-[.14em] text-white/15">Drag to canvas · click to insert</div>
    </div>
  );
}
