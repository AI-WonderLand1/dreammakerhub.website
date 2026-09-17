'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Cloud, Code2, GitBranch, Github, Rocket, Sparkles } from 'lucide-react';

type Choice = { label: string; value: string };
type LaunchOptions = {
  templateId: string;
  templateName: string;
  cpu: Choice[];
  memory: Choice[];
  regions: Choice[];
  repositorySupported: boolean;
  projects: { id: string; name: string; github_repo: string }[];
};
type PublicRepo = { fullName: string; defaultBranch: string; branches: string[] };
type Stage = 'form' | 'provisioning' | 'ready' | 'error';

export default function WonderSpaceLaunch() {
  const { user, loading: authLoading } = useAuth();
  const [options, setOptions] = useState<LaunchOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [mode, setMode] = useState<'blank' | 'repo'>('blank');
  const [name, setName] = useState('my-workspace');
  const [repository, setRepository] = useState('');
  const [verified, setVerified] = useState<PublicRepo | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState('');
  const [branch, setBranch] = useState('');
  const [cpu, setCpu] = useState('');
  const [memory, setMemory] = useState('');
  const [region, setRegion] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [ideUrl, setIdeUrl] = useState('');
  const [sshCommand, setSshCommand] = useState('');

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetch('/api/user-workspace/options', { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Coder options unavailable.');
        return data as LaunchOptions;
      })
      .then((data) => {
        setOptions(data);
        setCpu(data.cpu.find((item) => item.value === '2')?.value || data.cpu[0].value);
        setMemory(data.memory.find((item) => item.value === '4')?.value || data.memory[0].value);
        setRegion(data.regions[0]?.value || '');
        setOptionsError('');
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setOptionsError(cause instanceof Error ? cause.message : 'Coder options unavailable.');
      });
    return () => controller.abort();
  }, [user?.id]);

  const changeRepo = (value: string) => {
    setRepository(value);
    setVerified(null);
    setBranch('');
    setRepoError('');
  };

  const checkRepository = async () => {
    if (!repository.trim()) { setRepoError('Choose a public GitHub repository.'); return; }
    setRepoLoading(true);
    setRepoError('');
    setVerified(null);
    try {
      const response = await fetch(`/api/user-workspace/repository?repo=${encodeURIComponent(repository.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Repository unavailable.');
      const repo = data as PublicRepo;
      setVerified(repo);
      setBranch(repo.defaultBranch);
    } catch (cause) {
      setRepoError(cause instanceof Error ? cause.message : 'Unable to load repository.');
    } finally {
      setRepoLoading(false);
    }
  };

  const provision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!options || !/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(name)) {
      setError('Enter a valid 3–32 character workspace name.');
      return;
    }
    if (mode === 'repo' && (!verified || !branch)) {
      setRepoError('Verify a public repository and choose its branch first.');
      return;
    }
    setStage('provisioning');
    setError('');
    try {
      const response = await fetch('/api/user-workspace/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podName: name,
          podType: 'ide',
          templateId: options.templateId,
          cpu: Number(cpu),
          memory: Number(memory),
          ...(region ? { region } : {}),
          ...(mode === 'repo' && verified ? { repository: verified.fullName, branch } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Workspace could not be created.');
      if (!data.ideUrl) throw new Error('Coder did not return an IDE URL.');
      setIdeUrl(data.ideUrl);
      setSshCommand(data.sshCommand || '');
      setStage('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Workspace could not be created.');
      setStage('error');
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#090d1d] p-16 text-center text-white">Checking your session…</div>;
  if (!user) return (
    <div className="min-h-screen bg-[#090d1d] p-16 text-center text-white">
      <h1 className="mb-6 text-3xl font-bold">Sign in to launch WonderSpace</h1>
      <Link href="/public-pages/auth" className="rounded-xl bg-indigo-600 px-6 py-3">Sign in</Link>
    </div>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d22] px-5 py-12 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(96,76,218,0.4),transparent_42%),radial-gradient(ellipse_at_85%_75%,rgba(18,148,206,0.28),transparent_45%),radial-gradient(ellipse_at_60%_0%,rgba(224,83,197,0.17),transparent_35%)]" />
      <div className="relative mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">← Back to Dashboard</Link>
        <div className="mt-10 mb-9 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-500/20 shadow-[0_0_45px_rgba(125,87,255,0.35)]"><Sparkles size={31} /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">AI Wonderland · Cloud IDE</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WonderSpace launchpad</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Choose a project, configure real Coder resources, and open your own VS Code workspace.</p>
        </div>

        {stage === 'ready' ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-cyan-300/30 bg-[#101931]/90 p-8 text-center shadow-2xl">
            <Rocket className="mx-auto mb-4 text-cyan-300" size={42} />
            <h2 className="text-2xl font-bold">Your Coder workspace is ready</h2>
            <p className="my-4 text-slate-300">{name}</p>
            <a href={ideUrl} className="block rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold">Open real IDE →</a>
            {sshCommand && <button type="button" className="mt-4 text-sm text-slate-300 underline" onClick={() => navigator.clipboard.writeText(sshCommand)}>Copy Coder SSH command</button>}
            <button type="button" onClick={() => setStage('form')} className="mt-5 block w-full text-sm text-slate-400 hover:text-white">Create another workspace</button>
          </section>
        ) : stage === 'provisioning' ? (
          <section aria-live="polite" className="mx-auto max-w-lg rounded-3xl border border-violet-400/30 bg-[#101931]/90 p-9 text-center">
            <Cloud className="mx-auto mb-4 animate-pulse text-cyan-300" size={42} />
            <h2 className="text-2xl font-semibold">Coder is preparing your workspace</h2>
            <p className="mt-3 text-slate-300">Waiting for the actual workspace to report ready. This may take a minute.</p>
          </section>
        ) : (
          <form onSubmit={provision} className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <section className="rounded-3xl border border-violet-300/20 bg-[#11182e]/90 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="mb-5 text-xl font-semibold">1. Start with</h2>
              <div className="grid gap-3">
                <button type="button" onClick={() => { setMode('blank'); setRepoError(''); }} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${mode === 'blank' ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 hover:border-white/30'}`}><Code2 className="shrink-0 text-cyan-300" /><span><strong className="block">Blank workspace</strong><span className="text-sm text-slate-300">A clean workspace in your existing Coder template.</span></span></button>
                <button type="button" disabled={!options?.repositorySupported} onClick={() => setMode('repo')} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${mode === 'repo' ? 'border-violet-400 bg-violet-400/10' : 'border-white/10 hover:border-white/30'}`}><Github className="shrink-0 text-violet-300" /><span><strong className="block">Public GitHub repository</strong><span className="text-sm text-slate-300">Clone a selected branch into the real workspace.</span></span></button>
                {!options?.repositorySupported && options && <p className="text-sm text-amber-200">Repository launch will appear after the new Coder template version is published. Blank workspaces remain available.</p>}
              </div>
              {mode === 'repo' && options?.repositorySupported && (
                <div className="mt-6 space-y-3">
                  <label htmlFor="repository" className="block text-sm font-medium">Public repository</label>
                  {options.projects.length > 0 && <select aria-label="Linked DreamMakerHub repositories" value="" onChange={(event) => changeRepo(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3 text-sm"><option value="">Choose a linked project…</option>{options.projects.map((project) => <option key={project.id} value={project.github_repo}>{project.name} · {project.github_repo}</option>)}</select>}
                  <input id="repository" value={repository} onChange={(event) => changeRepo(event.target.value)} placeholder="owner/repository" autoComplete="off" className="w-full rounded-xl border border-white/20 bg-slate-900 p-3 outline-none focus:border-cyan-400" />
                  <button type="button" disabled={repoLoading || !repository.trim()} onClick={checkRepository} className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200 disabled:opacity-50">{repoLoading ? 'Checking GitHub…' : 'Load repository branches'}</button>
                  {verified && <><p className="text-sm text-emerald-300">Public repository verified: {verified.fullName}</p><label htmlFor="branch" className="flex items-center gap-2 text-sm"><GitBranch size={15} /> Branch</label><select id="branch" value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{verified.branches.map((value) => <option key={value} value={value}>{value}</option>)}</select></>}
                  {repoError && <p role="alert" className="text-sm text-amber-200">{repoError}</p>}
                  <p className="text-xs text-slate-400">Private repositories need a user-authorized GitHub connection; no shared server token is sent to pods.</p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-cyan-300/20 bg-[#11182e]/90 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="mb-5 text-xl font-semibold">2. Configure workspace</h2>
              {!options && !optionsError && <p className="text-slate-300">Loading actual Coder template options…</p>}
              {optionsError && <p role="alert" className="rounded-xl bg-amber-950/40 p-4 text-amber-200">{optionsError} <button type="button" className="underline" onClick={() => window.location.reload()}>Retry</button></p>}
              {options && <div className="space-y-5">
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">Coder template: <span className="font-semibold text-white">{options.templateName}</span></p>
                <div><label htmlFor="workspace-name" className="mb-1 block text-sm font-medium">Workspace name</label><input id="workspace-name" required minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" value={name} onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3 outline-none focus:border-cyan-400" /><p className="mt-1 text-xs text-slate-400">3–32 characters, lowercase letters, numbers, and hyphens.</p></div>
                <div className="grid grid-cols-2 gap-4"><div><label htmlFor="workspace-cpu" className="mb-1 block text-sm">CPU</label><select id="workspace-cpu" value={cpu} onChange={(event) => setCpu(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{options.cpu.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label htmlFor="workspace-memory" className="mb-1 block text-sm">Memory</label><select id="workspace-memory" value={memory} onChange={(event) => setMemory(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{options.memory.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>
                {options.regions.length ? <div><label htmlFor="workspace-region" className="mb-1 block text-sm">Region</label><select id="workspace-region" value={region} onChange={(event) => setRegion(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{options.regions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div> : <p className="text-xs text-slate-400">Location is determined by your existing Coder cluster. No additional regions are configured.</p>}
                <button type="submit" disabled={!cpu || !memory || (mode === 'repo' && !verified)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-6 py-3 font-semibold shadow-[0_8px_30px_rgba(79,70,229,0.3)] disabled:cursor-not-allowed disabled:opacity-40"><Rocket className="mr-2 inline" size={18} /> Launch real Coder workspace</button>
              </div>}
              {stage === 'error' && <p role="alert" className="mt-4 rounded-xl border border-rose-300/30 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</p>}
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
