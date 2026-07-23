'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { logger } from '@/lib/logger';

const TOOLS = [
  {
    href: '/wonder-build/builder',
    icon: '🎨',
    title: 'Visual Builder',
    desc: 'Build apps and websites with drag-and-drop, code editing, and live preview.',
    highlight: true,
  },
  {
    href: '/wonder-build/playcanvas',
    icon: '🎮',
    title: 'PlayCanvas 3D',
    desc: 'Create and edit 3D scenes.',
  },
  {
    href: '/wonder-build/spatial',
    icon: '🌌',
    title: 'Spatial Designer',
    desc: 'Design in 3D space.',
  },
];

export default function WonderBuildHub() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6 text-white">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">AI Wonderland</p>
          <h1 className="mt-3 text-3xl font-bold">Wonder Build</h1>
          <p className="mt-2 text-sm text-white/40">Pick a tool to get started.</p>
        </div>
        
        {/* Featured Preview Card */}
        <section className="mb-6 w-full max-w-2xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-48 h-32">
                <Image src="/images/screenshots/playcanvas-builder.svg" alt="WonderBuild preview" fill className="object-cover rounded-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Featured Preview</h3>
                <p className="mt-2 text-sm text-white/70">Experience the future of website building with AI-powered WonderBuild.</p>
              </div>
            </div>
          </div>
        </section>
        
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`group rounded-xl border p-5 transition-all ${
                t.highlight
                  ? 'border-violet-500/40 bg-violet-500/10 hover:border-violet-400 hover:bg-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-500/10'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="mt-2 text-sm font-semibold text-white/80 group-hover:text-white">{t.title}</p>
              <p className="mt-1 text-xs text-white/30">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </Suspense>
  );
}
