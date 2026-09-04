'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSovereignOS } from '../context/SovereignOSContext';
import { PublishModal } from './PublishModal';
import { useBuilderStore } from '@/lib/builder/store';
import {
  Blocks,
  Check,
  Code2,
  Eye,
  Monitor,
  Package,
  Palette,
  Redo2,
  Rocket,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';

export type BuilderMode = 'design' | 'code' | 'preview';

export function SovereignNavBar({
  activeMode,
  onModeChange,
}: {
  activeMode: BuilderMode;
  onModeChange: (mode: BuilderMode) => void;
}) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [projectName, setProjectName] = useState('Website Project');
  const [publishOpen, setPublishOpen] = useState(false);
  const { running } = useSovereignOS();
  const { activeBreakpoint, setBreakpoint, zoom, setZoom, undo, redo } = useBuilderStore();

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const name = data?.project?.name;
        if (typeof name === 'string' && name.trim()) setProjectName(name.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const assetHref = projectId
    ? `/library?sendTo=builder&projectId=${encodeURIComponent(projectId)}`
    : '/library?sendTo=builder';

  const deviceButtons = [
    { id: 'desktop' as const, label: 'Desktop', icon: Monitor },
    { id: 'tablet' as const, label: 'Tablet', icon: Tablet },
    { id: 'mobile' as const, label: 'Mobile', icon: Smartphone },
  ];

  return (
    <header className="wb-builder-nav fixed inset-x-0 top-0 z-50 flex h-[52px] items-center justify-between border-b px-2.5 sm:px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/wonder-build" className="flex shrink-0 items-center gap-2" title="WonderBuild Start">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/20 bg-gradient-to-br from-violet-600 to-indigo-700 shadow-[0_0_20px_rgba(124,58,237,.28)]">
            <Blocks className="h-4 w-4 text-white" />
          </span>
          <span className="hidden text-[11px] font-black tracking-tight text-white lg:inline">WonderBuild</span>
        </Link>

        <span className="h-5 w-px bg-white/8" />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="max-w-[180px] truncate text-[10px] font-bold text-white/78">{projectName}</span>
            <span className="rounded bg-white/[.045] px-1 py-0.5 text-[7px] font-black text-white/30">BUILD</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[8px] font-semibold text-emerald-300/65">
            <Check size={9} /> Autosave
          </div>
        </div>

        <div className="ml-1 hidden items-center rounded-md border border-white/8 bg-black/20 p-0.5 md:flex" aria-label="Build mode">
          <button
            type="button"
            onClick={() => onModeChange('design')}
            className={`flex h-7 items-center gap-1 rounded px-2 text-[8px] font-bold transition ${activeMode === 'design' ? 'bg-violet-500/18 text-violet-200' : 'text-white/30 hover:text-white/65'}`}
            aria-pressed={activeMode === 'design'}
          >
            <Palette size={11} /> Design
          </button>
          <button
            type="button"
            onClick={() => onModeChange('code')}
            className={`flex h-7 items-center gap-1 rounded px-2 text-[8px] font-bold transition ${activeMode === 'code' ? 'bg-violet-500/18 text-violet-200' : 'text-white/30 hover:text-white/65'}`}
            aria-pressed={activeMode === 'code'}
          >
            <Code2 size={11} /> Code
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
        <div className="flex items-center rounded-lg border border-white/8 bg-black/25 p-1 shadow-inner">
          {deviceButtons.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setBreakpoint(id)}
              className={`flex h-7 w-8 items-center justify-center rounded-md transition ${activeBreakpoint === id ? 'bg-violet-500/18 text-violet-200 shadow-[0_0_12px_rgba(124,58,237,.12)]' : 'text-white/28 hover:bg-white/[.04] hover:text-white/65'}`}
              title={label}
              aria-label={`${label} canvas`}
              aria-pressed={activeBreakpoint === id}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        <select
          value={Math.round(zoom * 100)}
          onChange={(event) => setZoom(Number(event.target.value) / 100)}
          className="h-8 rounded-lg border border-white/8 bg-black/25 px-2 text-[9px] font-semibold text-white/55 outline-none hover:text-white"
          aria-label="Canvas zoom"
        >
          {[50, 75, 100, 125, 150, 175, 200].map((value) => (
            <option key={value} value={value}>{value}%</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-0.5 sm:flex">
          <button type="button" onClick={undo} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/28 transition hover:bg-white/[.04] hover:text-white/70" title="Undo" aria-label="Undo">
            <Undo2 size={13} />
          </button>
          <button type="button" onClick={redo} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/28 transition hover:bg-white/[.04] hover:text-white/70" title="Redo" aria-label="Redo">
            <Redo2 size={13} />
          </button>
        </div>

        <Link
          href={assetHref}
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/8 bg-white/[.025] px-2 text-[8px] font-bold text-white/35 transition hover:border-violet-300/20 hover:bg-violet-500/8 hover:text-white lg:flex"
          title="Open website assets including images, video, and 3D web assets"
        >
          <Package size={12} /> Assets
        </Link>

        {running && (
          <span className="hidden items-center gap-1.5 rounded-full border border-violet-400/15 bg-violet-500/8 px-2 py-1 text-[8px] font-bold text-violet-200/80 xl:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" />AI
          </span>
        )}

        <button
          type="button"
          onClick={() => onModeChange('preview')}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[8px] font-black transition ${activeMode === 'preview' ? 'border-violet-300/25 bg-violet-500/16 text-violet-100' : 'border-white/8 bg-white/[.025] text-white/55 hover:border-white/15 hover:bg-white/[.05] hover:text-white'}`}
        >
          <Eye size={12} /> Preview
        </button>

        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="wb-publish-button inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[8px] font-black text-white transition hover:-translate-y-px"
        >
          <Rocket size={12} /> Publish
        </button>
      </div>

      <PublishModal isOpen={publishOpen} onClose={() => setPublishOpen(false)} />
    </header>
  );
}
