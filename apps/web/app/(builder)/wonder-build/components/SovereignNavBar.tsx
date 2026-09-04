'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSovereignOS } from '../context/SovereignOSContext';
import { PublishModal } from './PublishModal';
import { Blocks, FolderOpen, WandSparkles, Rocket, CircleCheckBig } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/wonder-build', label: 'Start', icon: WandSparkles },
  { href: '/wonder-build/builder', label: 'Build', icon: Blocks },
] as const;

export function SovereignNavBar() {
  const pathname = usePathname();
  const { running } = useSovereignOS();
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <header className="wb-builder-nav fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/wonder-build" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/20 bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_18px_rgba(124,58,237,.28)]"><Blocks className="h-3.5 w-3.5 text-white" /></span>
          <span className="hidden text-[11px] font-black tracking-tight text-white sm:inline">WonderBuild</span>
        </Link>
        <span className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-[10px] text-white/35"><span className="hidden md:inline">Website Builder</span><span className="hidden h-1 w-1 rounded-full bg-white/15 md:inline" /><span className="font-bold text-violet-200/70">Step 2 · Build</span></div>
      </div>

      <nav className="wb-builder-nav-pill absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-xl border p-1 md:flex">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black transition ${isActive ? 'bg-gradient-to-r from-violet-600/85 to-indigo-600/85 text-white shadow-[0_6px_18px_rgba(124,58,237,.2)]' : 'text-white/35 hover:bg-white/[.04] hover:text-white/70'}`}>
              <Icon className="h-3.5 w-3.5" /><span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        {running ? (
          <span className="hidden items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-bold text-violet-200 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,.7)]" />AI working</span>
        ) : (
          <span className="hidden items-center gap-1.5 text-[9px] font-bold text-white/25 lg:flex"><CircleCheckBig className="h-3.5 w-3.5 text-emerald-300/70" />Ready</span>
        )}
        <button type="button" onClick={() => setPublishOpen(true)} className="wb-publish-button inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[10px] font-black text-white transition hover:-translate-y-0.5">
          <Rocket className="h-3.5 w-3.5" />Publish
        </button>
      </div>

      <PublishModal isOpen={publishOpen} onClose={() => setPublishOpen(false)} />
    </header>
  );
}
