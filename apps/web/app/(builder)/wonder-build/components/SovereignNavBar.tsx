'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSovereignOS } from '../context/SovereignOSContext';
import { PublishModal } from './PublishModal';
import {
  Blocks,
  FolderOpen,
  WandSparkles,
  Rocket,
  CircleCheckBig,
  Palette,
  Code2,
  Eye,
  Package,
} from 'lucide-react';

type BuilderMode = 'design' | 'code' | 'preview';

const MODE_TABS: Array<{ id: BuilderMode; label: string; icon: typeof Palette }> = [
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
];

export function SovereignNavBar() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const requestedTab = searchParams.get('tab');
  const initialMode: BuilderMode = requestedTab === 'code' || requestedTab === 'preview' ? requestedTab : 'design';
  const [activeMode, setActiveMode] = useState<BuilderMode>(initialMode);
  const { running } = useSovereignOS();
  const [publishOpen, setPublishOpen] = useState(false);

  const modeHref = (mode: BuilderMode) => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    params.set('tab', mode);
    return `/wonder-build/builder?${params.toString()}`;
  };

  const activateMode = (mode: BuilderMode) => {
    setActiveMode(mode);

    // The legacy header remains in the DOM as the existing state controller,
    // but is visually hidden by WonderBuild CSS. Reuse its proven switchTab
    // handlers so changing view mode does not reload the page or risk dropping
    // a pending autosave. This can be removed once BuilderContent owns the
    // unified header directly.
    const legacyTabs = Array.from(
      document.querySelectorAll<HTMLButtonElement>("header[role='banner'] button[role='tab']")
    );
    const target = legacyTabs.find((button) => button.textContent?.toLowerCase().includes(mode));

    if (target) {
      target.click();
      return;
    }

    // Safe fallback if the legacy controller is removed before this bridge.
    window.location.href = modeHref(mode);
  };

  const assetHref = projectId
    ? `/library?sendTo=builder&projectId=${encodeURIComponent(projectId)}`
    : '/library?sendTo=builder';

  return (
    <header className="wb-builder-nav fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link href="/wonder-build" className="flex shrink-0 items-center gap-2" title="WonderBuild Start">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/20 bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_18px_rgba(124,58,237,.28)]">
            <Blocks className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="hidden text-[11px] font-black tracking-tight text-white sm:inline">WonderBuild</span>
        </Link>

        <span className="hidden h-4 w-px bg-white/10 sm:block" />

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] font-bold text-white/35 transition hover:bg-white/[.04] hover:text-white/70"
          >
            <FolderOpen className="h-3.5 w-3.5" />Projects
          </Link>
          <Link
            href="/wonder-build"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] font-bold text-white/35 transition hover:bg-white/[.04] hover:text-white/70"
          >
            <WandSparkles className="h-3.5 w-3.5" />Start
          </Link>
        </div>
      </div>

      <nav
        className="wb-builder-nav-pill absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border p-1"
        aria-label="Builder view mode"
      >
        {MODE_TABS.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => activateMode(mode.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] font-black transition sm:px-3 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-[0_6px_18px_rgba(124,58,237,.22)]'
                  : 'text-white/35 hover:bg-white/[.04] hover:text-white/70'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href={assetHref}
          className="hidden items-center gap-1.5 rounded-xl border border-white/8 bg-white/[.035] px-2.5 py-1.5 text-[9px] font-bold text-white/45 transition hover:border-violet-300/20 hover:bg-violet-500/10 hover:text-white md:flex"
          title="Open website asset library"
        >
          <Package className="h-3.5 w-3.5" />Assets
        </Link>

        {running ? (
          <span className="hidden items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-bold text-violet-200 xl:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,.7)]" />AI working
          </span>
        ) : (
          <span className="hidden items-center gap-1.5 text-[9px] font-bold text-white/25 xl:flex">
            <CircleCheckBig className="h-3.5 w-3.5 text-emerald-300/70" />Ready
          </span>
        )}

        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="wb-publish-button inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9px] font-black text-white transition hover:-translate-y-0.5 sm:px-3.5 sm:text-[10px]"
        >
          <Rocket className="h-3.5 w-3.5" />Publish
        </button>
      </div>

      <PublishModal isOpen={publishOpen} onClose={() => setPublishOpen(false)} />
    </header>
  );
}
