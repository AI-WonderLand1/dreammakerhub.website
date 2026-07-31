'use client';
import { useEffect } from 'react';
import { BLOCKS } from '@/lib/builder/components/ComponentLibrary';
import { blockToCanvasElement } from '@/lib/wp-engine/gutenberg';
import { useWpEditorStore } from '@/lib/wp-engine/editor-store';
import { WpBlockRenderer } from './WpBlockRenderer';
import { BlockInserter } from './BlockInserter';
import { BlockToolbar } from './BlockToolbar';
import { BlockInspector } from './BlockInspector';
import { WpTopbar } from './WpTopbar';

function BlockCanvas() {
  const elements = useWpEditorStore((s) => s.elements);
  const title = useWpEditorStore((s) => s.title);
  const selectedId = useWpEditorStore((s) => s.selectedId);
  const select = useWpEditorStore((s) => s.select);
  const addBlock = useWpEditorStore((s) => s.addBlock);
  const setTitle = useWpEditorStore((s) => s.setTitle);

  const insertBelow = (index: number) => {
    const def = BLOCKS.find((b) => b.type === 'paragraph');
    if (def) addBlock(blockToCanvasElement(def), index + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[780px] px-6 py-10">
        <input
          placeholder="Add title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/25"
        />

        {elements.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-white/40">Start building — pick a block from the library on the left.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-0">
            {elements.map((el, idx) => (
              <div key={el.id} className="group relative">
                <div
                  className={`rounded-lg border px-4 py-3 transition-colors ${
                    selectedId === el.id
                      ? 'border-purple-500 bg-purple-500/5'
                      : 'border-transparent hover:border-white/10'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    select(el.id);
                  }}
                >
                  <div className="pointer-events-none w-full overflow-hidden text-white/90 [&_a]:pointer-events-none">
                    <WpBlockRenderer element={el} />
                  </div>
                </div>

                <BlockToolbar element={el} index={idx} />

                <div className="flex justify-center py-0.5">
                  <button
                    onClick={() => insertBelow(idx)}
                    className="h-6 rounded-full border border-dashed border-white/10 px-2 text-[10px] text-white/25 opacity-0 transition-opacity hover:border-purple-500/50 hover:text-purple-300 group-hover:opacity-100"
                    title="Insert block below"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => insertBelow(elements.length - 1)}
          className="mt-4 w-full rounded-xl border border-dashed border-white/15 py-3 text-xs font-semibold text-white/30 transition-colors hover:border-purple-500/40 hover:text-purple-300"
        >
          + Add block
        </button>
      </div>
    </div>
  );
}

export function WPCanvasEditor() {
  const setElements = useWpEditorStore((s) => s.setElements);

  useEffect(() => {
    const stored = localStorage.getItem('aiw-wp-editor-draft');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setElements(parsed.elements || []);
        useWpEditorStore.getState().setTitle(parsed.title || '');
      } catch {}
    }
  }, [setElements]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <WpTopbar />
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '48px' }}>
        <BlockInserter />
        <BlockCanvas />
        <BlockInspector />
      </div>
    </div>
  );
}
