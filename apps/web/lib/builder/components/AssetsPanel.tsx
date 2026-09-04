'use client';

import Link from 'next/link';
import { Box, FileImage, FolderOpen, Video } from 'lucide-react';
import FileManagerPanel from '@/components/file-manager/FileManagerPanel';

export default function AssetsPanel({ projectId }: { projectId: string }) {
  const libraryHref = projectId
    ? `/library?sendTo=builder&projectId=${encodeURIComponent(projectId)}`
    : '/library?sendTo=builder';

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-[#070b16] text-white" aria-label="Assets panel">
      <div className="shrink-0 border-b border-white/8 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300/45">Media</p>
            <h3 className="mt-0.5 text-[11px] font-black">Assets</h3>
          </div>
          <Link
            href={libraryHref}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 text-[9px] font-black text-white shadow-[0_8px_20px_rgba(124,58,237,.22)]"
          >
            <FolderOpen size={12} /> Library
          </Link>
        </div>

        <p className="mt-2 text-[9px] leading-4 text-white/30">
          Images, video, documents, and website-safe 3D assets. GLB/GLTF are treated like web media components, not game scenes.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            [FileImage, 'Images'],
            [Video, 'Video'],
            [Box, 'GLB/GLTF'],
          ].map(([Icon, label]) => {
            const AssetIcon = Icon as typeof FileImage;
            return (
              <div key={String(label)} className="rounded-lg border border-white/7 bg-white/[.025] px-2 py-2 text-center">
                <AssetIcon size={13} className="mx-auto text-violet-300/70" />
                <p className="mt-1 text-[8px] font-bold text-white/35">{String(label)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <FileManagerPanel projectId={projectId} />
      </div>
    </section>
  );
}
