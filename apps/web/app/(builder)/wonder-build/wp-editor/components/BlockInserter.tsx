'use client';
import { useMemo } from 'react';
import { BLOCKS, BLOCK_CATEGORIES } from '@/lib/builder/components/ComponentLibrary';
import { BlockDefinition } from '@/lib/builder/types';
import { blockToCanvasElement } from '@/lib/wp-engine/gutenberg';
import { useWpEditorStore } from '@/lib/wp-engine/editor-store';

export function BlockInserter() {
  const { search, setSearch, activeCategory, setActiveCategory, addBlock, leftOpen, setLeftOpen } = useWpEditorStore();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BLOCKS.filter(
      (b) =>
        b.category === activeCategory &&
        (!q || b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
    );
  }, [search, activeCategory]);

  if (!leftOpen) return null;

  const handleAdd = (block: BlockDefinition) => {
    addBlock(blockToCanvasElement(block));
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-[#0b0f19] text-white">
      <div className="shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">
            Blocks ({BLOCKS.length})
          </h3>
          <button onClick={() => setLeftOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1">
            ✕
          </button>
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
                activeCategory === cat.key
                  ? 'bg-purple-600 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
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
          <button
            key={block.type}
            onClick={() => handleAdd(block)}
            className="flex w-full items-center gap-2.5 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group text-left"
            title={block.description}
          >
            <span className="text-lg shrink-0">{block.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-white/80 truncate">{block.name}</span>
              <span className="block text-[10px] text-white/30 truncate">{block.description}</span>
            </span>
            <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
