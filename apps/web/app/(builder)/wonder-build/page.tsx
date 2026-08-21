'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  Boxes,
  Box,
  Compass,
  Palette,
  Library,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const TOOLS = [
  {
    href: '/wonder-build/builder',
    icon: Palette,
    title: 'Visual Builder',
    desc: 'Build apps and websites with drag-and-drop, code editing, and live preview.',
    highlight: true,
  },
  {
    href: '/dashboard/3dhub',
    icon: Boxes,
    title: '3DHub Studio',
    desc: 'AI 3D Factory, 360 panoramas, game levels, cinematic timelines, and NPC simulation.',
    highlight: true,
    tag: '3D',
  },
  {
    href: '/wonder-build/playcanvas',
    icon: Box,
    title: 'PlayCanvas 3D',
    desc: 'Create and edit 3D scenes in a full PlayCanvas engine editor.',
  },
  {
    href: '/wonder-build/spatial',
    icon: Compass,
    title: 'Spatial Designer',
    desc: 'Design immersive 3D spaces and environments.',
  },
  {
    href: '/wonder-build/templates',
    icon: Library,
    title: 'Template Library',
    desc: 'Browse 60+ batch prompt templates, generate new ones with AI, and visualize them in the visual renderer.',
    tag: 'AI',
  },
];

export default function WonderBuildHub() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(ellipse 40% 40% at 85% 110%, rgba(34,211,238,0.10), transparent 60%)',
            }}
          />
          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
              <Sparkles size={11} /> AI Wonderland
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Wonder<span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Build</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/50">
              Every tool shares the same memory, the same auth, the same deploy pipeline — pick the door that fits what
              you&apos;re making.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/wonder-build/builder"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
              >
                <Palette size={16} /> Start with Visual Builder <ArrowRight size={14} />
              </Link>
              <Link
                href="/dashboard/3dhub"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Boxes size={16} /> Open 3DHub
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-5xl px-6 py-10">
          {/* Featured Preview */}
          <section className="mb-8">
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative flex-shrink-0 w-full h-40 sm:w-56 sm:h-32">
                  <Image
                    src="/images/screenshots/playcanvas-builder.svg"
                    alt="WonderBuild preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold">Featured Preview</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Experience the future of building with AI-powered WonderBuild — from landing pages to full 3D worlds.
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/40 sm:justify-start">
                    <span className="flex items-center gap-1.5"><Brain size={12} className="text-violet-400" /> AI generation</span>
                    <span className="flex items-center gap-1.5"><Boxes size={12} className="text-cyan-400" /> 3D studio</span>
                    <span className="flex items-center gap-1.5"><Palette size={12} className="text-pink-400" /> Visual editor</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tools grid */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Pick a tool</h2>
              <span className="text-[11px] font-mono text-white/25">{TOOLS.length} tools</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`group relative rounded-xl border p-5 transition-all ${
                    t.highlight
                      ? 'border-violet-500/40 bg-violet-500/10 hover:border-violet-400 hover:bg-violet-500/20'
                      : 'border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-500/10'
                  }`}
                >
                  {t.tag && (
                    <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-violet-600/40 to-cyan-600/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-100">
                      {t.tag}
                    </span>
                  )}
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-violet-400/40">
                    <t.icon size={18} className="text-white/70 group-hover:text-white" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white/80 group-hover:text-white">{t.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{t.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </Suspense>
  );
}
