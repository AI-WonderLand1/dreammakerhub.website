'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, EyeOff, GripVertical, LockKeyhole, Trash2 } from 'lucide-react';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';

interface LayersPanelProps {
  embedded?: boolean;
}

export default function LayersPanel({ embedded = false }: LayersPanelProps) {
  const { elements, selectedId, selectElement, removeElement, moveElement } = useBuilderStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapsed = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveUp = (id: string, parentId: string | null, index: number) => {
    if (index > 0) moveElement(id, parentId, index - 1);
  };

  const moveDown = (id: string, parentId: string | null, index: number, length: number) => {
    if (index < length - 1) moveElement(id, parentId, index + 1);
  };

  const renderTree = (items: CanvasElement[], parentId: string | null, depth = 0) => (
    <div className={depth === 0 ? 'space-y-0.5' : 'space-y-0.5'}>
      {items.map((el, index) => {
        const hasChildren = Boolean(el.children?.length);
        const isCollapsed = collapsed.has(el.id);
        const isSelected = selectedId === el.id;

        return (
          <div key={el.id}>
            <div
              className={`group flex h-8 items-center gap-1 rounded-md border pr-1 transition ${
                isSelected
                  ? 'border-violet-400/25 bg-violet-500/14 text-white shadow-[inset_2px_0_0_rgba(139,92,246,.9)]'
                  : 'border-transparent text-white/55 hover:border-white/7 hover:bg-white/[.035] hover:text-white/85'
              }`}
              style={{ paddingLeft: `${6 + depth * 14}px` }}
            >
              <button
                type="button"
                onClick={() => hasChildren && toggleCollapsed(el.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/25 ${hasChildren ? 'hover:bg-white/5 hover:text-white/60' : 'pointer-events-none opacity-25'}`}
                aria-label={hasChildren ? `${isCollapsed ? 'Expand' : 'Collapse'} ${el.name}` : undefined}
                tabIndex={hasChildren ? 0 : -1}
              >
                {hasChildren ? (isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />) : <span className="h-1 w-1 rounded-full bg-white/20" />}
              </button>

              <GripVertical size={11} className="shrink-0 text-white/12 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />

              <button
                type="button"
                onClick={() => selectElement(el.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                aria-current={isSelected ? 'true' : undefined}
              >
                <span className="text-[10px] text-violet-200/60">{el.icon || '◇'}</span>
                <span className="truncate text-[10px] font-medium">{el.name}</span>
              </button>

              {el.locked && <LockKeyhole size={9} className="shrink-0 text-amber-300/60" aria-label="Locked" />}
              {el.hidden && <EyeOff size={9} className="shrink-0 text-white/25" aria-label="Hidden" />}

              <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); moveUp(el.id, parentId, index); }}
                  disabled={index === 0}
                  className="h-5 w-4 text-[9px] text-white/25 hover:text-white disabled:opacity-15"
                  title="Move up"
                  aria-label={`Move ${el.name} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); moveDown(el.id, parentId, index, items.length); }}
                  disabled={index === items.length - 1}
                  className="h-5 w-4 text-[9px] text-white/25 hover:text-white disabled:opacity-15"
                  title="Move down"
                  aria-label={`Move ${el.name} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); removeElement(el.id); }}
                  className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:bg-red-500/10 hover:text-red-300"
                  aria-label={`Delete ${el.name}`}
                  title="Delete layer"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            </div>

            {hasChildren && !isCollapsed && renderTree(el.children!, el.id, depth + 1)}
          </div>
        );
      })}
    </div>
  );

  return (
    <section className={`wb-layers-dock flex min-h-0 w-full flex-col bg-[#070b16] text-white ${embedded ? 'h-full' : 'h-full'}`} aria-label="Layers panel">
      <div className="shrink-0 border-b border-white/8 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">Structure</p>
            <h3 className="mt-0.5 text-[10px] font-black text-white/80">Layers</h3>
          </div>
          <span className="rounded bg-white/[.04] px-1.5 py-0.5 text-[8px] font-bold text-white/25">{elements.length}</span>
        </div>
      </div>

      {elements.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-[9px] leading-relaxed text-white/25">
          Add blocks from Insert and they will appear here as an editable layer tree.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {renderTree(elements, null)}
        </div>
      )}
    </section>
  );
}
