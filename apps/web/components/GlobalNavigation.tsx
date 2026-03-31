'use client';

import Link from 'next/link';
import { PAGES } from '../lib/navigation';

interface GlobalNavigationProps {
  className?: string;
  variant?: 'full' | 'minimal' | 'mobile';
}

export function GlobalNavigation({ className = '', variant = 'full' }: GlobalNavigationProps) {
  const builderPages = PAGES.filter(p => p.category === 'builder');
  const workspacePages = PAGES.filter(p => p.category === 'workspace');
  const toolPages = PAGES.filter(p => p.category === 'tools');
  const communityPages = PAGES.filter(p => p.category === 'community');
  const docPages = PAGES.filter(p => p.category === 'docs');

  if (variant === 'minimal') {
    return (
      <nav className={`flex gap-4 text-sm ${className}`}>
        <Link href="/" className="hover:text-cyan-400 transition">🏠 Home</Link>
        <Link href="/builder-ai" className="hover:text-cyan-400 transition">🤖 Builder</Link>
        <Link href="/play" className="hover:text-cyan-400 transition">▶️ Play</Link>
        <Link href="/community" className="hover:text-cyan-400 transition">👥 Community</Link>
        <Link href="/docs" className="hover:text-cyan-400 transition">📖 Docs</Link>
      </nav>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={`flex flex-col gap-2 text-sm ${className}`}>
        <Link href="/" className="px-3 py-2 rounded hover:bg-white/10">🏠 Home</Link>
        <Link href="/builder-ai" className="px-3 py-2 rounded hover:bg-blue-500/20">🤖 AI Builder</Link>
        <Link href="/builder" className="px-3 py-2 rounded hover:bg-blue-500/20">🔨 Builder</Link>
        <Link href="/(workspace)/dashboard" className="px-3 py-2 rounded hover:bg-green-500/20">📊 Dashboard</Link>
        <Link href="/play" className="px-3 py-2 rounded hover:bg-green-500/20">▶️ Play</Link>
        <Link href="/marketplace" className="px-3 py-2 rounded hover:bg-purple-500/20">🛍️ Marketplace</Link>
        <Link href="/community" className="px-3 py-2 rounded hover:bg-pink-500/20">👥 Community</Link>
        <Link href="/tutorials" className="px-3 py-2 rounded hover:bg-yellow-500/20">📚 Tutorials</Link>
        <Link href="/docs" className="px-3 py-2 rounded hover:bg-yellow-500/20">📖 Docs</Link>
        <Link href="/support" className="px-3 py-2 rounded hover:bg-red-500/20">💬 Support</Link>
      </div>
    );
  }

  // Full navigation
  return (
    <nav className={`border-b border-cyan-500/30 bg-black/50 backdrop-blur ${className}`}>
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        {/* Logo */}
        <Link href="/" className="cyberpunk-text text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-blue-500 to-green-500">
          AI-WONDERLAND
        </Link>

        {/* Main Navigation */}
        <div className="flex gap-6 flex-wrap">
          {/* Builders */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40 font-semibold">BUILD:</span>
            <div className="flex gap-2">
              {builderPages.map(page => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="px-2 py-1 rounded text-sm hover:bg-blue-500/20 transition text-blue-300"
                  title={page.description}
                >
                  {page.icon} {page.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40 font-semibold">WORKSPACE:</span>
            <div className="flex gap-2">
              {workspacePages.map(page => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="px-2 py-1 rounded text-sm hover:bg-green-500/20 transition text-green-300"
                  title={page.description}
                >
                  {page.icon} {page.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40 font-semibold">TOOLS:</span>
            <div className="flex gap-2">
              {toolPages.slice(0, 2).map(page => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="px-2 py-1 rounded text-sm hover:bg-yellow-500/20 transition text-yellow-300"
                  title={page.description}
                >
                  {page.icon} {page.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Community & Docs */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40 font-semibold">LEARN:</span>
            <div className="flex gap-2">
              {docPages.map(page => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="px-2 py-1 rounded text-sm hover:bg-purple-500/20 transition text-purple-300"
                  title={page.description}
                >
                  {page.icon} {page.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href="/connect-storage" className="px-3 py-1 rounded text-sm hover:bg-cyan-500/20 transition border border-cyan-500/30">
            ☁️ Storage
          </Link>
          <Link href="/settings" className="px-3 py-1 rounded text-sm hover:bg-cyan-500/20 transition border border-cyan-500/30">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Secondary Navigation - Quick Links */}
      <div className="px-4 py-2 bg-black/30 text-xs border-t border-cyan-500/20 flex gap-3 overflow-x-auto">
        <Link href="/play" className="hover:text-green-400 whitespace-nowrap">▶️ Play Preview</Link>
        <Link href="/marketplace" className="hover:text-purple-400 whitespace-nowrap">🛍️ Asset Store</Link>
        <Link href="/community" className="hover:text-pink-400 whitespace-nowrap">👥 Community</Link>
        <Link href="/support" className="hover:text-red-400 whitespace-nowrap">💬 Support</Link>
      </div>
    </nav>
  );
}

export default GlobalNavigation;
