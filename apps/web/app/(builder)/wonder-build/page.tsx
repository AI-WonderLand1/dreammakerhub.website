'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FilePlus2,
  LayoutTemplate,
  Sparkles,
  FolderOpen,
  WandSparkles,
  MonitorSmartphone,
  Blocks,
  Rocket,
  Check,
} from 'lucide-react';

const steps = [
  { number: '1', label: 'Start', sub: 'Blank, template, or AI' },
  { number: '2', label: 'Build', sub: 'AI + drag/drop + preview' },
  { number: '3', label: 'Publish', sub: 'Domain, SEO, go live' },
];

export default function WonderBuildStartPage() {
  const [projectName, setProjectName] = useState('Untitled Website');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routingExistingProject, setRoutingExistingProject] = useState(false);

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    if (!projectId) return;
    setRoutingExistingProject(true);
    window.location.replace(`/wonder-build/builder?projectId=${encodeURIComponent(projectId)}`);
  }, []);

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

  if (routingExistingProject) {
    return (
      <main className="wb-start-shell flex min-h-screen items-center justify-center text-sm text-white/60">
        Opening website project…
      </main>
    );
  }

  return (
    <main className="wb-start-shell min-h-screen text-white">
      <header className="wb-template-nav sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-[0_0_28px_rgba(124,58,237,.35)]">
              <Blocks className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#070b18] bg-cyan-300" />
            </div>
            <div>
              <p className="text-[17px] font-black tracking-tight">WonderBuild</p>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-violet-300/70">AI Website Builder</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-1.5 md:flex">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${index === 0 ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/30' : 'text-white/35'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-violet-500 text-white shadow-[0_0_18px_rgba(139,92,246,.5)]' : 'bg-white/5'}`}>{step.number}</span>
                  <div>
                    <div className="text-[11px] font-bold">{step.label}</div>
                    <div className="text-[9px] text-white/35">{step.sub}</div>
                  </div>
                </div>
                {index < steps.length - 1 && <ArrowRight className="mx-1 h-3.5 w-3.5 text-white/15" />}
              </div>
            ))}
          </div>

          <Link href="/dashboard/projects" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-xs font-bold text-white/70 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white">
            <FolderOpen className="h-4 w-4" />
            My Projects
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
          <div className="wb-glass relative overflow-hidden rounded-[28px] p-7 sm:p-9 lg:p-11">
            <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative z-10 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-violet-200">
                <WandSparkles className="h-3.5 w-3.5" /> Step 1 · Start your website
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-5xl lg:text-6xl">
                Build something people
                <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">remember.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300/70 sm:text-base">
                Start blank, choose a designed template, or let AI create the first version. From there, everything opens in one visual editor for drag-and-drop, AI changes, preview, and publishing.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ['One editor', 'No duplicate builder handoffs'],
                  ['Visual + AI', 'Design directly on the canvas'],
                  ['Preview live', 'Publish when it feels right'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-2xl border border-white/8 bg-black/20 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white"><Check className="h-3.5 w-3.5 text-cyan-300" />{title}</div>
                    <p className="mt-1.5 text-[10px] leading-4 text-white/35">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="wb-hero-graphic p-6">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">Live creation system</div>
                <MonitorSmartphone className="h-5 w-5 text-white/40" />
              </div>
              <div className="ml-auto w-[68%] rounded-2xl border border-violet-300/20 bg-[#080d20]/80 p-4 shadow-[0_30px_80px_rgba(34,51,120,.35)] backdrop-blur-xl">
                <div className="flex items-center gap-1.5 border-b border-white/8 pb-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400/70" /><span className="h-2 w-2 rounded-full bg-amber-300/70" /><span className="h-2 w-2 rounded-full bg-emerald-300/70" />
                </div>
                <div className="mt-4 h-2 w-2/3 rounded-full bg-violet-300/40" />
                <div className="mt-2 h-2 w-5/6 rounded-full bg-white/10" />
                <div className="mt-2 h-2 w-1/2 rounded-full bg-white/10" />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="h-14 rounded-lg bg-gradient-to-br from-violet-500/35 to-blue-500/10" />
                  <div className="h-14 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/10" />
                  <div className="h-14 rounded-lg bg-gradient-to-br from-fuchsia-500/25 to-blue-500/10" />
                </div>
              </div>
              <p className="max-w-xs text-[11px] leading-5 text-white/45">Start fast. Then shape every detail in Build mode.</p>
            </div>
          </div>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <article className="wb-neon-card flex min-h-[330px] flex-col rounded-[24px] p-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,.12)]"><FilePlus2 className="h-5 w-5" /></div>
              <span className="text-[10px] font-black uppercase tracking-[.18em] text-white/20">Blank start</span>
            </div>
            <h2 className="text-xl font-black">Start from a clean canvas</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Create a real WonderBuild project instantly and enter the visual editor with no extra setup screen.</p>
            <label className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-white/35" htmlFor="wonderbuild-project-name">Project name</label>
            <input id="wonderbuild-project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-300/40 focus:shadow-[0_0_0_3px_rgba(34,211,238,.06)]" placeholder="Untitled Website" />
            <button type="button" onClick={createBlankWebsite} disabled={creating} className="mt-auto inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_14px_36px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
              <span>{creating ? 'Creating…' : 'Start Blank'}</span><ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="wb-neon-card flex min-h-[330px] flex-col rounded-[24px] p-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10 text-violet-200 shadow-[0_0_30px_rgba(139,92,246,.12)]"><LayoutTemplate className="h-5 w-5" /></div>
              <span className="text-[10px] font-black uppercase tracking-[.18em] text-white/20">Template start</span>
            </div>
            <h2 className="text-xl font-black">Choose a designed starting point</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Browse polished layouts, preview them, then open the selected design directly in the same visual builder.</p>
            <div className="my-6 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-xl border border-violet-300/10 bg-gradient-to-br from-violet-500/25 to-slate-950" />
              <div className="h-16 rounded-xl border border-cyan-300/10 bg-gradient-to-br from-cyan-400/15 to-slate-950" />
              <div className="h-16 rounded-xl border border-fuchsia-300/10 bg-gradient-to-br from-fuchsia-500/20 to-slate-950" />
            </div>
            <Link href="/wonder-build/templates" className="mt-auto inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(124,58,237,.24)] transition hover:-translate-y-0.5">
              <span>Browse Templates</span><ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="wb-neon-card flex min-h-[330px] flex-col rounded-[24px] p-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-200 shadow-[0_0_30px_rgba(217,70,239,.12)]"><Sparkles className="h-5 w-5" /></div>
              <span className="text-[10px] font-black uppercase tracking-[.18em] text-white/20">AI start</span>
            </div>
            <h2 className="text-xl font-black">Describe it. Let AI start it.</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Generate a visual starting design from a prompt, then keep editing with AI and drag-and-drop in Build mode.</p>
            <div className="my-6 rounded-2xl border border-fuchsia-300/10 bg-fuchsia-500/[.055] p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-fuchsia-200"><WandSparkles className="h-3.5 w-3.5" /> AI start</div>
              <p className="mt-2 text-[11px] leading-5 text-white/35">“Create a bold futuristic landing page for my startup…”</p>
            </div>
            <Link href="/wonder-build/templates?mode=ai" className="mt-auto inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(192,38,211,.2)] transition hover:-translate-y-0.5">
              <span>Generate with AI</span><Rocket className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
