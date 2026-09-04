'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FilePlus2, LayoutTemplate, Sparkles, FolderOpen } from 'lucide-react';

export default function WonderBuildStartPage() {
  const [projectName, setProjectName] = useState('Untitled Website');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBlankWebsite = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'Untitled Website',
          tool: 'wonderbuild',
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = `/public-pages/auth?redirectTo=${encodeURIComponent('/wonder-build')}`;
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.project?.id) {
        throw new Error(data?.message || 'Unable to create website project');
      }

      window.location.href = `/wonder-build/builder?projectId=${encodeURIComponent(data.project.id)}`;
    } catch (err: any) {
      setError(err?.message || 'Unable to create website project');
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <header className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-sm font-bold tracking-wide text-violet-300">WonderBuild</p>
            <p className="text-xs text-white/45">Website Builder</p>
          </div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <FolderOpen className="h-4 w-4" />
            My Projects
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
            Step 1 of 3 · Start
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">How do you want to start your website?</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
            Start blank, choose a template, or generate a starting design with AI. After this, everything opens in the same visual builder for AI editing, drag-and-drop, preview, and publishing.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <article className="flex min-h-[300px] flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Blank Website</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Create a clean project and go straight into the real drag-and-drop website editor.</p>

            <label className="mt-6 text-[11px] font-bold uppercase tracking-wider text-white/40" htmlFor="wonderbuild-project-name">
              Project name
            </label>
            <input
              id="wonderbuild-project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="mt-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-400/50"
              placeholder="Untitled Website"
            />

            <button
              type="button"
              onClick={createBlankWebsite}
              disabled={creating}
              className="mt-auto inline-flex items-center justify-between rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-black transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
            >
              <span>{creating ? 'Creating…' : 'Start Blank'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="flex min-h-[300px] flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Choose a Template</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Browse the existing WonderBuild template collection. Choosing Customize creates the project and opens it directly in the same editor.
            </p>
            <div className="mt-6 rounded-xl border border-white/8 bg-black/20 p-4 text-xs leading-5 text-white/40">
              Templates are a starting point, not a separate builder.
            </div>
            <Link
              href="/wonder-build/templates"
              className="mt-auto inline-flex items-center justify-between rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-500"
            >
              <span>Browse Templates</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="flex min-h-[300px] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-fuchsia-500/[0.08] to-white/[0.035] p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Generate with AI</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Use the existing AI/template generation tools to create a starting design, then continue in the same visual builder with AI and drag-and-drop editing.
            </p>
            <div className="mt-6 rounded-xl border border-fuchsia-400/10 bg-fuchsia-500/[0.05] p-4 text-xs leading-5 text-fuchsia-100/55">
              AI is a way to start and an editing tool inside Build — not another product step.
            </div>
            <Link
              href="/wonder-build/templates?mode=ai"
              className="mt-auto inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-3 text-sm font-black text-white transition hover:from-fuchsia-500 hover:to-violet-500"
            >
              <span>Start with AI</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-white/35">
          <span className="font-bold text-white/55">3-step flow:</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-violet-300">1. Start</span>
          <span>→</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">2. Build + Preview</span>
          <span>→</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">3. Publish</span>
        </div>
      </section>
    </main>
  );
}
