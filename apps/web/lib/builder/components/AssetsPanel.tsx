'use client';

import { Box, FileImage, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import FileManagerPanel from '@/components/file-manager/FileManagerPanel';
import { findBlockDefinition } from '../blocks/utils';
import { blockToCanvasElement } from '../dnd-utils';
import { useBuilderStore } from '../store';

const ASSET_KINDS: Array<{ icon: LucideIcon; label: string; type: string; hint: string }> = [
  { icon: FileImage, label: 'Image', type: 'image', hint: 'PNG, JPG, WebP, SVG' },
  { icon: Video, label: 'Video', type: 'video', hint: 'YouTube, Vimeo, MP4' },
  { icon: Box, label: '3D Model', type: 'model-3d', hint: 'GLB / GLTF web viewer' },
];

export default function AssetsPanel({ projectId }: { projectId: string }) {
  const addElement = useBuilderStore((state) => state.addElement);
  const selectElement = useBuilderStore((state) => state.selectElement);
  const setRightPanelOpen = useBuilderStore((state) => state.setRightPanelOpen);
  const setRightPanelTab = useBuilderStore((state) => state.setRightPanelTab);

  const insertAssetBlock = (type: string) => {
    const definition = findBlockDefinition(type);
    if (!definition) return;
    const element = blockToCanvasElement(definition);
    addElement(element);
    selectElement(element.id);
    setRightPanelOpen(true);
    setRightPanelTab('content');
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-[#070b16] text-white" aria-label="Assets panel">
      <div className="shrink-0 border-b border-white/8 p-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300/45">Website media</p>
          <h3 className="mt-0.5 text-[11px] font-black">Assets</h3>
        </div>

        <p className="mt-2 text-[9px] leading-4 text-white/30">
          Add media directly to this page. 3D is a GLB/GLTF website viewer only—no scenes, NPCs, or game tooling.
        </p>

        <div className="mt-3 space-y-1.5">
          {ASSET_KINDS.map(({ icon: AssetIcon, label, type, hint }) => (
            <button
              key={type}
              type="button"
              onClick={() => insertAssetBlock(type)}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-white/7 bg-white/[.025] p-2.5 text-left transition hover:border-violet-300/22 hover:bg-violet-500/[.055]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/12 bg-violet-500/8 text-violet-200">
                <AssetIcon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-black text-white/70 group-hover:text-white">Insert {label}</span>
                <span className="mt-0.5 block truncate text-[8px] text-white/25">{hint}</span>
              </span>
              <span className="text-sm font-light text-violet-200/45">+</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-white/8 px-3 py-2 text-[8px] font-black uppercase tracking-[.16em] text-white/25">
          Project files
        </div>
        <div className="min-h-0 flex-1">
          <FileManagerPanel projectId={projectId} />
        </div>
      </div>
    </section>
  );
}
