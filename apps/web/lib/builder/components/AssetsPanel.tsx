'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, FileImage, Loader2, Upload, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import FileManagerPanel from '@/components/file-manager/FileManagerPanel';
import { findBlockDefinition } from '../blocks/utils';
import { blockToCanvasElement } from '../dnd-utils';
import { useBuilderStore } from '../store';

const ASSET_KINDS: Array<{ icon: LucideIcon; label: string; type: string; hint: string }> = [
  { icon: FileImage, label: 'Image', type: 'image', hint: 'PNG, JPG, WebP, SVG' },
  { icon: Video, label: 'Video', type: 'video', hint: 'YouTube, Vimeo, MP4' },
  { icon: Box, label: '3D Model', type: 'model-3d', hint: 'Upload GLB / GLTF and insert it immediately' },
];

type Stored3DAsset = {
  asset_id?: string;
  name?: string;
  local_url?: string;
};

export default function AssetsPanel({ projectId }: { projectId: string }) {
  const addElement = useBuilderStore((state) => state.addElement);
  const selectElement = useBuilderStore((state) => state.selectElement);
  const setRightPanelOpen = useBuilderStore((state) => state.setRightPanelOpen);
  const setRightPanelTab = useBuilderStore((state) => state.setRightPanelTab);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [models, setModels] = useState<Stored3DAsset[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [modelStatus, setModelStatus] = useState<string | null>(null);

  const insertAssetBlock = useCallback((type: string, initialProps: Record<string, unknown> = {}) => {
    const definition = findBlockDefinition(type);
    if (!definition) return;
    const element = blockToCanvasElement(definition);
    element.props = { ...element.props, ...initialProps };
    addElement(element);
    selectElement(element.id);
    setRightPanelOpen(true);
    setRightPanelTab('content');
  }, [addElement, selectElement, setRightPanelOpen, setRightPanelTab]);

  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('/api/assets/upload');
      if (!response.ok) return;
      const data = await response.json();
      const assets = Array.isArray(data?.assets) ? data.assets as Stored3DAsset[] : [];
      setModels(assets.filter((asset) => typeof asset.local_url === 'string' && /\.(?:glb|gltf)(?:\?.*)?$/i.test(asset.local_url)));
    } catch {
      // The upload control still works even if the saved library cannot be loaded.
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const insertModel = useCallback((url: string, name?: string) => {
    insertAssetBlock('model-3d', {
      src: url,
      alt: name ? `3D model: ${name}` : 'Interactive 3D model',
    });
  }, [insertAssetBlock]);

  const uploadModel = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'glb' && extension !== 'gltf') {
      setModelStatus('Choose a .glb or .gltf file');
      return;
    }

    setUploadingModel(true);
    setModelStatus('Uploading…');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.(?:glb|gltf)$/i, ''));

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.url !== 'string') {
        throw new Error(data?.error || data?.details || 'Upload failed');
      }

      insertModel(data.url, data.name || file.name);
      setModelStatus('3D model inserted');
      await loadModels();
    } catch (error) {
      setModelStatus(error instanceof Error ? error.message : '3D upload failed');
    } finally {
      setUploadingModel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAssetAction = (type: string) => {
    if (type === 'model-3d') {
      fileInputRef.current?.click();
      return;
    }
    insertAssetBlock(type);
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-[#070b16] text-white" aria-label="Assets panel">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadModel(file);
        }}
      />

      <div className="shrink-0 border-b border-white/8 p-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300/45">Website media</p>
          <h3 className="mt-0.5 text-[11px] font-black">Assets</h3>
        </div>

        <p className="mt-2 text-[9px] leading-4 text-white/30">
          Add media directly to this page. 3D uses a real GLB/GLTF web viewer, not a fake scene placeholder.
        </p>

        <div className="mt-3 space-y-1.5">
          {ASSET_KINDS.map(({ icon: AssetIcon, label, type, hint }) => {
            const isModel = type === 'model-3d';
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleAssetAction(type)}
                disabled={isModel && uploadingModel}
                className="group flex w-full items-center gap-2.5 rounded-lg border border-white/7 bg-white/[.025] p-2.5 text-left transition hover:border-violet-300/22 hover:bg-violet-500/[.055] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/12 bg-violet-500/8 text-violet-200">
                  {isModel && uploadingModel ? <Loader2 size={14} className="animate-spin" /> : <AssetIcon size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black text-white/70 group-hover:text-white">
                    {isModel ? (uploadingModel ? 'Uploading 3D Model' : 'Upload 3D Model') : `Insert ${label}`}
                  </span>
                  <span className="mt-0.5 block truncate text-[8px] text-white/25">{hint}</span>
                </span>
                {isModel ? <Upload size={12} className="text-violet-200/45" /> : <span className="text-sm font-light text-violet-200/45">+</span>}
              </button>
            );
          })}
        </div>

        {modelStatus && (
          <div className="mt-2 rounded-md border border-violet-300/10 bg-violet-500/[.04] px-2 py-1.5 text-[8px] text-violet-100/55">
            {modelStatus}
          </div>
        )}

        <div className="mt-3 rounded-lg border border-white/7 bg-white/[.015] p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-[.15em] text-white/25">Your 3D models</span>
            <span className="text-[8px] text-white/20">{loadingModels ? 'Loading…' : models.length}</span>
          </div>

          <div className="space-y-1">
            {models.slice(0, 8).map((model, index) => (
              <button
                key={model.asset_id || model.local_url || `${model.name}-${index}`}
                type="button"
                onClick={() => model.local_url && insertModel(model.local_url, model.name)}
                className="flex w-full items-center gap-2 rounded-md border border-white/5 bg-black/10 px-2 py-1.5 text-left hover:border-violet-300/15 hover:bg-violet-500/[.035]"
              >
                <Box size={10} className="shrink-0 text-violet-300/55" />
                <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-white/55">{model.name || '3D model'}</span>
                <span className="text-[8px] font-bold text-violet-200/55">Insert</span>
              </button>
            ))}

            {!loadingModels && models.length === 0 && (
              <div className="rounded-md border border-dashed border-white/7 p-3 text-center text-[8px] leading-4 text-white/25">
                No uploaded 3D models yet. Use Upload 3D Model above. GLB is the most reliable format because textures can travel inside one file.
              </div>
            )}
          </div>
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
