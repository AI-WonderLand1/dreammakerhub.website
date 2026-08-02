'use client';

import React from 'react';
import { useBuilderStore } from '../store';

export default function LayersPanel() {
  const { elements, selectedId, selectElement, removeElement, moveElement } = useBuilderStore();

  const moveUp = (id: string, parentId: string | null, index: number) => {
    if (index <= 0) return;
    moveElement(id, parentId, index - 1);
  };

  const moveDown = (id: string, parentId: string | null, index: number, length: number) => {
    if (index >= length - 1) return;
    moveElement(id, parentId, index + 1);
  };

  return (
    <div className="flex flex-col h-full w-[23.4rem] bg-[#0b0f19] text-white">
      <div className="shrink-0 p-3 border-b border-white/10">
        <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Layers</h3>
      </div>

      {elements.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-xs text-white/30 p-4">
          No elements added yet. Drag blocks from the library.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {elements.map((el, index) => (
            <div key={el.id}>
              <div
                onClick={() => selectElement(el.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  selectedId === el.id
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-white/5 bg-white/[0.02] text-white/70 hover:border-white/20'
                }`}
              >
                <span className="text-white/30 font-mono text-[10px] w-4">{index + 1}</span>
                <span className="text-sm">{el.icon || '📦'}</span>
                <span className="font-medium truncate flex-1">{el.name}</span>
                {el.locked && <span className="text-yellow-500 text-[10px]">🔒</span>}
                {el.hidden && <span className="text-white/30 text-[10px]">👁️</span>}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveUp(el.id, null, index); }}
                    disabled={index === 0}
                    className="text-white/30 hover:text-white disabled:opacity-20 px-0.5 text-[10px]"
                    title="Move up"
                    aria-label={`Move ${el.name} up`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveDown(el.id, null, index, elements.length); }}
                    disabled={index >= elements.length - 1}
                    className="text-white/30 hover:text-white disabled:opacity-20 px-0.5 text-[10px]"
                    title="Move down"
                    aria-label={`Move ${el.name} down`}
                  >
                    ↓
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                    className="text-white/30 hover:text-red-400 px-1 text-xs"
                    aria-label={`Delete ${el.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {el.children && el.children.length > 0 && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2">
                  {el.children.map((child, ci) => (
                    <div
                      key={child.id}
                      onClick={() => selectElement(child.id)}
                      className={`flex items-center gap-2 p-1.5 rounded border text-[10px] cursor-pointer transition-colors ${
                        selectedId === child.id
                          ? 'border-purple-500/50 bg-purple-500/10 text-white'
                          : 'border-white/5 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-white/20">{child.icon || '•'}</span>
                      <span className="truncate flex-1">{child.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveUp(child.id, el.id, ci); }}
                        disabled={ci === 0}
                        className="text-white/30 hover:text-white disabled:opacity-20 px-0.5"
                        title="Move up"
                        aria-label={`Move ${child.name} up`}
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveDown(child.id, el.id, ci, el.children!.length); }}
                        disabled={ci >= el.children!.length - 1}
                        className="text-white/30 hover:text-white disabled:opacity-20 px-0.5"
                        title="Move down"
                        aria-label={`Move ${child.name} down`}
                      >
                        ↓
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
