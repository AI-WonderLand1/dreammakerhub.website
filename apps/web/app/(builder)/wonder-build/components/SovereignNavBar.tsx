'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSovereignOS } from '../context/SovereignOSContext';

const NAV_LINKS = [
  { href: '/wonder-build', label: 'Hub', icon: '🏠' },
  { href: '/wonder-build/agent', label: 'AI Builder', icon: '🤖' },
  { href: '/wonder-build/preview', label: 'Preview', icon: '👁️' },
  { href: '/wonder-build/sandbox', label: 'Sandbox', icon: '📄' },
  { href: '/wonder-build/puck', label: 'Puck', icon: '🎨' },
  { href: '/wonder-build/playcanvas', label: '3D', icon: '🎮' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
] as const;

export function SovereignNavBar() {
  const pathname = usePathname();
  const { running } = useSovereignOS();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-white/10 bg-[#0b0b0d]/95 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/wonder-build" className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-violet-400">
          AI Wonderland
        </Link>
        <span className="h-4 w-px bg-white/15" />
        <p className="truncate text-xs text-white/60">Dream / Template Builder</p>
      </div>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1 md:flex">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        {running && (
          <span className="hidden items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-1 text-[10px] text-violet-200 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" /> Working
          </span>
        )}
        <button
          type="button"
          className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:opacity-90"
        >
          Publish
        </button>
      </div>
    </header>
  );
}
