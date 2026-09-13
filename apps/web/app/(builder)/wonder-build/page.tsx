'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Blocks, Check, FilePlus2, FolderOpen, Search, Sparkles, WandSparkles } from 'lucide-react';
import { INITIAL_PRESET_TEMPLATES } from '@/lib/wonder-build/template-library/data/presetTemplates';
import type { WonderBuildTemplate } from '@/lib/wonder-build/template-library/types';
import { buildBuilderStatePayload } from '@/lib/wonder-build/template-library/utils/builderAdapter';

const steps = [
  { number: '1', label: 'Template', sub: 'Template, AI, or blank' },
  { number: '2', label: 'Build', sub: 'AI + drag/drop + preview' },
  { number: '3', label: 'Publish', sub: 'Domain, SEO, go live' },
];

function aiTemplatePrompt(request: string) {
  return `Create exactly one production-ready website template for this request: ${request}\n\nReturn ONLY a JSON array with one object using this shape:\n[{"id":"ai-generated-template","name":"Specific site name","description":"Short description","category":"AI Generated","thumbnail":"","elements":[{"type":"nav | section | div | heading | text | button | image | grid | card | footer","content":"text when appropriate","href":"#section","src":"https://example.com/image.jpg","alt":"Useful alt text","styles":{"camelCaseCssProperty":"value"},"children":[]}]}]\n\nBuild a complete site with useful, specific content. Use 4-6 meaningful sections plus navigation/footer where appropriate. Do not use lorem ipsum, Sample, Placeholder, or generic filler. Use only these element types: section, div, heading, text, button, image, grid, card, nav, footer. Use camelCase CSS-in-JS style keys. Return only valid JSON.`;
}

export default function WonderBuildTemplateStep() {
  const [projectName, setProjectName] = useState('Untitled Website');
  const [aiPrompt, setAiPrompt] = useState('');
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routingExistingProject, setRoutingExistingProject] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(INITIAL_PRESET_TEMPLATES.map((template) => template.category))).sort()],
    [],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return INITIAL_PRESET_TEMPLATES.filter((template) => {
      const categoryMatches = category === 'All' || template.category === category;
      const searchMatches = !query || `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query);
      return categoryMatches && searchMatches;
    });
  }, [category, search]);

  const visibleTemplates = showAll ? filteredTemplates : filteredTemplates.slice(0, 12);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('projectId');
    if (projectId) {
      setRoutingExistingProject(true);
      window.location.replace(`/wonder-build/builder?projectId=${encodeURIComponent(projectId)}`);
      return;
    }
    if (params.get('mode') === 'ai') {
      window.setTimeout(() => document.getElementById('ai-start')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  }, []);

  const createProject = async (name: string): Promise<string> => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() || 'Untitled Website', tool: 'wonderbuild' }),
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = `/public-pages/auth?redirectTo=${encodeURIComponent('/wonder-build')}`;
      throw new Error('Authentication required');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.project?.id) throw new Error(data?.message || 'Unable to create website project');
    return data.project.id as string;
  };

  const seedTemplate = async (projectId: string, template: WonderBuildTemplate) => {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: { 'builder-state.json': buildBuilderStatePayload(template) } }),
    });
    if (!response.ok) throw new Error('Unable to seed the builder with this template');
  };

  const openBuilder = (projectId: string) => {
    window.location.href = `/wonder-build/builder?projectId=${encodeURIComponent(projectId)}`;
  };

  const startBlank = async () => {
    if (creatingKey) return;
    setCreatingKey('blank');
    setError(null);
    try {
      const projectId = await createProject(projectName);
      openBuilder(projectId);
    } catch (err: any) {
      if (err?.message !== 'Authentication required') setError(err?.message || 'Unable to create website project');
      setCreatingKey(null);
    }
  };

  const useTemplate = async (template: WonderBuildTemplate) => {
    if (creatingKey) return;
    setCreatingKey(template.id);
    setError(null);
    try {
      const projectId = await createProject(template.name);
      await seedTemplate(projectId, template);
      openBuilder(projectId);
    } catch (err: any) {
      if (err?.message !== 'Authentication required') setError(err?.message || 'Unable to open template');
      setCreatingKey(null);
    }
  };

  const generateWithAI = async () => {
    const request = aiPrompt.trim();
    if (!request || creatingKey) return;
    setCreatingKey('ai');
    setError(null);

    try {
      const response = await fetch('/api/wonder-build/template-library/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'AI Generated', batchPrompt: aiTemplatePrompt(request) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !Array.isArray(data.templates) || !data.templates[0]) {
        throw new Error(data?.error || 'AI did not return a usable website template');
      }

      const template = data.templates[0] as WonderBuildTemplate;
      if (!Array.isArray(template.elements) || template.elements.length === 0) throw new Error('AI returned an empty website template');

      const projectId = await createProject(template.name || projectName || 'AI Website');
      await seedTemplate(projectId, template);
      openBuilder(projectId);
    } catch (err: any) {
      setError(err?.message || 'Unable to generate website with AI');
      setCreatingKey(null);
    }
  };

  if (routingExistingProject) {
    return <main className="wb-start-shell flex min-h-screen items-center justify-center text-sm text-white/60">Opening website project…</main>;
  }

  return (
    <main className="wb-start-shell min-h-screen text-white">
      <header className="wb-template-nav sticky top-0 z-40 border-b">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-6 py-2 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-[0_0_28px_rgba(124,58,237,.35)]">
              <Blocks className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#070b18] bg-cyan-300" />
            </div>
            <div>
              <p className="text-[17px] font-black tracking-tight">WonderBuild</p>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-violet-300/70">Website Builder</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-1.5 md:flex" aria-label="WonderBuild steps">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${index === 0 ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/30' : 'text-white/35'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-violet-500 text-white' : 'bg-white/5'}`}>{step.number}</span>
                  <div><div className="text-[11px] font-bold">{step.label}</div><div className="text-[9px] text-white/35">{step.sub}</div></div>
                </div>
                {index < steps.length - 1 && <ArrowRight className="mx-1 h-3.5 w-3.5 text-white/15" />}
              </div>
            ))}
          </div>

          <Link href="/dashboard#projects" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-xs font-bold text-white/70 transition hover:border-violet-400/30 hover:text-white">
            <FolderOpen className="h-4 w-4" /> My Projects
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-8 lg:px-8">
        <div className="wb-glass rounded-[28px] p-7 sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-violet-200">
            <WandSparkles className="h-3.5 w-3.5" /> Step 1 · Template
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-5xl">Pick the starting point. <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Build everything in one editor.</span></h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300/70 sm:text-base">Choose a template below, ask AI to generate one, or start blank. Every choice creates one project and opens the same WonderBuild canvas. Step 2 is Build. Step 3 is Publish.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((step) => <div key={step.number} className="rounded-2xl border border-white/8 bg-black/20 p-3.5"><div className="flex items-center gap-2 text-xs font-bold"><Check className="h-3.5 w-3.5 text-cyan-300" />{step.number}. {step.label}</div><p className="mt-1.5 text-[10px] leading-4 text-white/35">{step.sub}</p></div>)}
          </div>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <article className="wb-neon-card flex min-h-[270px] flex-col rounded-[24px] p-6">
            <div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200"><FilePlus2 className="h-5 w-5" /></div><span className="text-[10px] font-black uppercase tracking-[.18em] text-white/20">Blank</span></div>
            <h2 className="text-xl font-black">Start with an empty canvas</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Create a real project and go directly to Build.</p>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} className="mt-5 rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-300/40" placeholder="Untitled Website" />
            <button type="button" onClick={startBlank} disabled={Boolean(creatingKey)} className="mt-4 inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60"><span>{creatingKey === 'blank' ? 'Creating…' : 'Start Blank'}</span><ArrowRight className="h-4 w-4" /></button>
          </article>

          <article id="ai-start" className="wb-neon-card flex min-h-[270px] flex-col rounded-[24px] p-6">
            <div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-200"><Sparkles className="h-5 w-5" /></div><span className="text-[10px] font-black uppercase tracking-[.18em] text-white/20">AI</span></div>
            <h2 className="text-xl font-black">Describe the site you want</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">AI generates the starting template, saves it into the project, and opens the same Build canvas.</p>
            <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={3} className="mt-5 resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-fuchsia-300/40" placeholder="Build a premium dark coffee shop website with online ordering, testimonials, gallery, and contact section…" />
            <button type="button" onClick={generateWithAI} disabled={Boolean(creatingKey) || !aiPrompt.trim()} className="mt-4 inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><span>{creatingKey === 'ai' ? 'Generating…' : 'Generate with AI'}</span><WandSparkles className="h-4 w-4" /></button>
          </article>
        </div>

        <section id="templates" className="mt-9 scroll-mt-24">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300/60">Template Library</div><h2 className="mt-1 text-2xl font-black">Choose a real starting design</h2><p className="mt-1 text-sm text-white/40">Selecting one creates the project, saves builder-state.json, and opens Build immediately.</p></div>
            <div className="relative w-full lg:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates…" className="w-full rounded-xl border border-white/10 bg-black/25 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-300/35" /></div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setShowAll(false); }} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold ${category === item ? 'border-violet-300/30 bg-violet-500/15 text-violet-100' : 'border-white/8 bg-white/[.025] text-white/35'}`}>{item}</button>)}</div>

          {visibleTemplates.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/35">No templates match that filter.</div> : <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleTemplates.map((template) => <article key={template.id} className="group overflow-hidden rounded-2xl border border-white/8 bg-black/20 transition hover:-translate-y-1 hover:border-violet-300/25"><div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-950/70 via-slate-950 to-cyan-950/50">{template.thumbnail ? <img src={template.thumbnail} alt="" className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-95" /> : null}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10"><span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-bold text-white/65">{template.category}</span></div></div><div className="p-4"><h3 className="truncate text-sm font-black">{template.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-[11px] leading-5 text-white/35">{template.description}</p><button type="button" onClick={() => void useTemplate(template)} disabled={Boolean(creatingKey)} className="mt-3 inline-flex w-full items-center justify-between rounded-xl border border-violet-300/15 bg-violet-500/10 px-3 py-2.5 text-xs font-black text-violet-100 disabled:opacity-45"><span>{creatingKey === template.id ? 'Opening…' : 'Use Template'}</span><ArrowRight className="h-3.5 w-3.5" /></button></div></article>)}</div>}

          {filteredTemplates.length > 12 && <div className="mt-6 text-center"><button type="button" onClick={() => setShowAll((value) => !value)} className="rounded-xl border border-white/10 bg-white/[.035] px-5 py-2.5 text-xs font-bold text-white/55">{showAll ? 'Show fewer templates' : `Show all ${filteredTemplates.length} templates`}</button></div>}
        </section>
      </section>
    </main>
  );
}
