'use client';
import { CanvasElement } from '@/lib/builder/types';
import { useWpEditorStore } from '@/lib/wp-engine/editor-store';

export function BlockToolbar({ element, index }: { element: CanvasElement; index: number }) {
  const selectedId = useWpEditorStore((s) => s.selectedId);
  const elements = useWpEditorStore((s) => s.elements);
  const select = useWpEditorStore((s) => s.select);
  const moveBlock = useWpEditorStore((s) => s.moveBlock);
  const duplicateBlock = useWpEditorStore((s) => s.duplicateBlock);
  const removeBlock = useWpEditorStore((s) => s.removeBlock);

  if (selectedId !== element.id) return null;

  const canUp = index > 0;
  const canDown = index < elements.length - 1;

  const btn =
    'flex h-7 w-7 items-center justify-center rounded text-xs text-white/70 transition-colors hover:bg-white/15 hover:text-white';

  return (
    <div
      className="absolute -top-4 left-0 z-10 flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#161b28] px-1 py-0.5 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button className={btn} onClick={() => moveBlock(element.id, -1)} disabled={!canUp} title="Move up"
        style={!canUp ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}>
        ↑
      </button>
      <button className={btn} onClick={() => moveBlock(element.id, 1)} disabled={!canDown} title="Move down"
        style={!canDown ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}>
        ↓
      </button>
      <button className={btn} onClick={() => duplicateBlock(element.id)} title="Duplicate">
        ⧉
      </button>
      <span className="mx-1 h-4 w-px bg-white/10" />
      <button
        className="flex h-7 w-7 items-center justify-center rounded text-xs text-red-300/80 transition-colors hover:bg-red-500/20 hover:text-red-200"
        onClick={() => removeBlock(element.id)}
        title="Remove"
      >
        ✕
      </button>
      <span className="mx-1 h-4 w-px bg-white/10" />
      <button
        className="flex h-7 items-center rounded px-2 text-[10px] font-semibold text-white/50 transition-colors hover:bg-white/15 hover:text-white"
        onClick={() => select(null)}
        title="Deselect"
      >
        {element.icon} {element.name}
      </button>
    </div>
  );
}
