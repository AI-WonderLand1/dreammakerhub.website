'use client';
import Link from 'next/link';
import { Suspense } from 'react';

const TOOLS = [
  {
    href: '/wonder-build/agent',
    icon: '🤖',
    title: 'AI Builder',
    desc: 'Describe what you want — AI agents build it.',
  },
  {
    href: '/wonder-build/preview',
    icon: '👁️',
    title: 'Live Preview',
    desc: 'See your build in action.',
  },
  {
    href: '/wonder-build/sandbox',
    icon: '📄',
    title: 'Code Sandbox',
    desc: 'Edit code and sync to cloud storage.',
  },
  {
    href: '/wonder-build/puck',
    icon: '🎨',
    title: 'Puck Editor',
    desc: 'Drag-and-drop visual page builder.',
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
  {
    href: '/wonder-build/ai-builder',
    icon: '⚡',
    title: 'AI Builder Pro',
    desc: 'Full build flow with asset library & download.',
  },
];

export default function WonderBuildHub() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6 text-white">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">AI Wonderland</p>
          <h1 className="mt-3 text-3xl font-bold">Wonder Build</h1>
          <p className="mt-2 text-sm text-white/40">Choose a tool to get started.</p>
        </div>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-violet-500/40 hover:bg-violet-500/5"
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
