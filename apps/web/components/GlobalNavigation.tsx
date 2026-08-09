'use client';

import Link from 'next/link';
import { PRIMARY_NAV, SECONDARY_NAV, type SecondaryNavItem } from '../lib/navigation';
import { logger } from '@/lib/logger';

interface GlobalNavigationProps {
  className?: string;
  variant?: 'full' | 'minimal' | 'mobile';
}

function SecondaryLink({ item }: { item: SecondaryNavItem }) {
  const classes = 'px-2 py-1 rounded text-sm transition whitespace-nowrap';
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${classes} text-yellow-300 hover:bg-yellow-500/20`}
      >
        {item.icon} {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={`${classes} text-white/70 hover:bg-white/10 hover:text-white`}>
      {item.icon} {item.label}
    </Link>
  );
}

export function GlobalNavigation({ className = '', variant = 'full' }: GlobalNavigationProps) {
  if (variant === 'minimal') {
    return (
      <nav className={`flex gap-4 text-sm ${className}`}>
        {PRIMARY_NAV.map((p) => (
          <Link key={p.id} href={p.href} className="hover:text-cyan-400 transition">
            {p.icon} {p.label}
          </Link>
        ))}
        <a href="https://playground.dreammakerhub.website/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">
          🎮 Playground
        </a>
        <Link href="/docs" className="hover:text-cyan-400 transition">
          📖 Docs
        </Link>
      </nav>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={`flex flex-col gap-2 text-sm ${className}`}>
        {PRIMARY_NAV.map((p) => (
          <div key={p.id}>
            <Link href={p.href} className="px-3 py-2 rounded flex items-center gap-2 font-semibold text-white hover:bg-blue-500/20">
              {p.icon} {p.label}
            </Link>
            <div className="ml-3 flex flex-col">
              {p.items.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded text-white/60 hover:bg-white/10"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.href} href={item.href} className="px-3 py-1.5 rounded text-white/60 hover:bg-white/10">
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
        <div className="border-t border-white/10 pt-1">
          {SECONDARY_NAV.map((item) => (
            <div key={item.label} className="py-0.5">
              <SecondaryLink item={item} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full navigation — three primary creation destinations + secondary utilities.
  return (
    <nav className={`border-b border-cyan-500/30 bg-black/50 backdrop-blur ${className}`}>
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        <Link href="/" className="cyberpunk-text text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-blue-500 to-green-500">
          AI-WONDERLAND
        </Link>

        <div className="flex gap-6 flex-wrap">
          {PRIMARY_NAV.map((dest) => (
            <div key={dest.id} className="flex items-center gap-1">
              <span className="text-xs text-white/40 font-semibold uppercase">{dest.label}:</span>
              <Link
                href={dest.href}
                className="px-2 py-1 rounded text-sm hover:bg-blue-500/20 transition text-blue-300"
                title={dest.tagline}
              >
                {dest.icon} {dest.product}
              </Link>
            </div>
          ))}

          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40 font-semibold uppercase">More:</span>
            {SECONDARY_NAV.slice(0, 4).map((item) => (
              <span key={item.label}>
                <SecondaryLink item={item} />
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/connect-storage" className="px-3 py-1 rounded text-sm hover:bg-cyan-500/20 transition border border-cyan-500/30">
            ☁️ Storage
          </Link>
          <Link href="/settings" className="px-3 py-1 rounded text-sm hover:bg-cyan-500/20 transition border border-cyan-500/30">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      <div className="px-4 py-2 bg-black/30 text-xs border-t border-cyan-500/20 flex gap-3 overflow-x-auto">
        <Link href="/dashboard/3dhub" className="hover:text-green-400 whitespace-nowrap">
          🎮 Play Preview
        </Link>
        <Link href="/marketplace" className="hover:text-purple-400 whitespace-nowrap">
          🛍️ Asset Store
        </Link>
        <Link href="/community" className="hover:text-pink-400 whitespace-nowrap">
          👥 Community
        </Link>
        <Link href="/support" className="hover:text-red-400 whitespace-nowrap">
          💬 Support
        </Link>
      </div>
    </nav>
  );
}

export default GlobalNavigation;