'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import CoderAvailabilityIndicator from './CoderAvailabilityIndicator';
import { Cloud, Code2, GitBranch, Github, Rocket, Sparkles } from 'lucide-react';

type Choice = { label: string; value: string };
type LaunchOptions = {
  templateId: string;
  templateName: string;
  cpu: Choice[];
  memory: Choice[];
  images: Choice[];
  regions: Choice[];
  repositorySupported: boolean;
};
type PublicRepo = { fullName: string; defaultBranch: string; branches: string[] };
type Stage = 'form' | 'provisioning' | 'ready' | 'error';

function uniqueWorkspaceName(userId: string): string {
  return `ws-${userId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function WonderSpaceLaunch() {
  const { user, session, loading: authLoading } = useAuth();
  const [options, setOptions] = useState<LaunchOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [mode, setMode] = useState<'blank' | 'repo'>('blank');
  const [name, setName] = useState('');
  const [repository, setRepository] = useState('');
  const [verified, setVerified] = useState<PublicRepo | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState('');
  const [branch, setBranch] = useState('');
  const [cpu, setCpu] = useState('');
  const [memory, setMemory] = useState('');
  const [ideImage, setIdeImage] = useState('');
  const [region, setRegion] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [ideUrl, setIdeUrl] = useState('');
  const [sshCommand, setSshCommand] = useState('');

  useEffect(() => {
    if (user) setName(uniqueWorkspaceName(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setOptions(null);
    setOptionsError('');
    setOptionsLoading(true);
    fetch('/api/user-workspace/options', { signal: controller.signal, cache: 'no-store', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Coder options unavailable.');
        return data as LaunchOptions;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.cpu) || !data.cpu.length ||
            !Array.isArray(data.memory) || !data.memory.length ||
            !Array.isArray(data.regions) || !Array.isArray(data.images)) {
          throw new Error('Coder has not returned usable workspace options.');
        }
        setOptions(data);
        setCpu(data.cpu[0].value);
        setMemory(data.memory[0].value);
        setIdeImage(data.images[0]?.value || '');
        setRegion(data.regions[0]?.value || '');
        setOptionsError('');
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setOptionsError(cause instanceof Error ? cause.message : 'Coder options unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });
    return () => controller.abort();
  }, [user?.id, session?.access_token, retryCount]);

  const changeRepo = (value: string) => {
    setRepository(value);
    setVerified(null);
    setBranch('');
    setRepoError('');
  };

  const checkRepository = async () => {
    if (!repository.trim()) { setRepoError('Enter a public GitHub repository.'); return; }
    setRepoLoading(true);
    setRepoError('');
    setVerified(null);
    try {
      const response = await fetch(`/api/user-workspace/repository?repo=${encodeURIComponent(repository.trim())}`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
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
    if (!options || optionsLoading || optionsError || !cpu || !memory) {
      setError('Coder is not connected yet. Retry the connection before launching a workspace.');
      setStage('error');
      return;
    }
    if (options.images.length && !options.images.some((image) => image.value === ideImage)) {
      setError('Choose an approved IDE environment.');
      setStage('error');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(name)) {
      setError('Enter a valid 3–32 character workspace name.');
      setStage('error');
      return;
    }
    if (mode === 'repo' && !options.repositorySupported) {
      setRepoError('Repository launch requires a published Coder template that supports repositories.');
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
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({
          podName: name,
          podType: 'ide',
          templateId: options.templateId,
          cpu: Number(cpu),
          memory: Number(memory),
          ...(options.images.length ? { ideImage } : {}),
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

  const launchReady = Boolean(options && !optionsLoading && !optionsError && name && cpu && memory &&
    (!options.images.length || ideImage) &&
    (mode === 'blank' || (options.repositorySupported && verified && branch)));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d22] px-5 py-12 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(96,76,218,0.4),transparent_42%),radial-gradient(ellipse_at_85_75%,rgba(18,148,206,0.28),transparent_45%),radial-gradient(ellipse_at_60%_0%,rgba(224,83,197,0.17),transparent_35%)]" />
      <div className="relative mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">← Back to Dashboard</Link>
        <div className="mt-10 mb-9 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-500/20"><Sparkles size={31} /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">DreamMakerHub · Cloud IDE</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WonderSpace launchpad</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Choose an IDE environment and project on the same page. Coder prepares your private workspace when access is enabled.</p>
          <Link href="/wonderspace/workspaces" className="mt-3 inline-block text-sm text-cyan-200 underline">Open an existing IDE instead</Link>
        </div>
        {stage === 'ready' ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-cyan-300/30 bg-[#101931]/90 p-8 text-center shadow-2xl">
            <Rocket className="mx-auto mb-4 text-cyan-300" size={42} />
            <h2 className="text-2xl font-bold">Your Coder workspace is ready</h2>
            <p className="my-4 text-slate-300">{name}</p>
            <a href={ideUrl} className="block rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold">Open real IDE →</a>
            {sshCommand && <button type="button" className="mt-4 text-sm text-slate-300 underline" onClick={() => navigator.clipboard.writeText(sshCommand)}>Copy Coder SSH command</button>}
            <button type="button" onClick={() => { setName(uniqueWorkspaceName(user.id)); setStage('form'); }} className="mt-5 block w-full text-sm text-slate-400 hover:text-white">Create another workspace</button>
          </section>
        ) : stage === 'provisioning' ? (
          <section aria-live="polite" className="mx-auto max-w-lg rounded-3xl border border-violet-400/30 bg-[#101931]/90 p-9 text-center">
            <Cloud className="mx-auto mb-4 animate-pulse text-cyan-300" size={42} />
            <h2 className="text-2xl font-semibold">Coder is preparing your workspace</h2>
            <p className="mt-3 text-slate-300">Waiting for the actual workspace to report ready. This may take a minute.</p>
          </section>
        ) : (
          <form onSubmit={provision} className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <section className="rounded-3xl border border-violet-300/20 bg-[#11182e]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">1. Choose your project</h2>
              <div className="grid gap-3">
                <button type="button" aria-pressed={mode === 'blank'} onClick={() => { setMode('blank'); setRepoError(''); }} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left ${mode === 'blank' ? 'border-cyan-400 bg-cyan-400/15' : 'border-white/20 bg-white/5'}`}>
                  <Code2 className="text-cyan-300" /><span className="flex-1"><strong className="block">Blank workspace</strong><span className="text-sm text-slate-300">Start with an empty project.</span></span>
                </button>
                <button type="button" aria-pressed={mode === 'repo'} onClick={() => setMode('repo')} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left ${mode === 'repo' ? 'border-violet-400 bg-violet-400/15' : 'border-white/20 bg-white/5'}`}>
                  <Github className="text-violet-300" /><span className="flex-1"><strong className="block">Public GitHub repository</strong><span className="text-sm text-slate-300">Choose a repository and branch.</span></span>
                </button>
              </div>
              {mode === 'repo' && (
                <div className="mt-6 space-y-3">
                  <label htmlFor="repository" className="block text-sm font-medium">Public repository</label>
                  <input id="repository" value={repository} onChange={(event) => changeRepo(event.target.value)} placeholder="owner/repository" autoComplete="off" className="w-full rounded-xl border border-white/20 bg-slate-900 p-3" />
                  <button type="button" disabled={repoLoading || !repository.trim()} onClick={checkRepository} className="w-full rounded-xl border border-cyan-400/60 px-4 py-3 text-sm font-semibold disabled:opacity-50">{repoLoading ? 'Checking GitHub…' : 'Load repository branches'}</button>
                  {verified && <><p className="text-sm text-emerald-300">Public repository verified: {verified.fullName}</p><label htmlFor="branch" className="flex items-center gap-2 text-sm"><GitBranch size={15} /> Branch</label><select id="branch" value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{verified.branches.map((value) => <option key={value} value={value}>{value}</option>)}</select></>}
                  {repoError && <p role="alert" className="text-sm text-amber-200">{repoError}</p>}
                  {options && !options.repositorySupported && <p role="status" className="text-sm text-amber-200">Repository launch requires a published Coder template with repository support.</p>}
                  <p className="text-xs text-slate-400">Private repositories need a user-authorized GitHub connection; no shared server credentials are sent to pods.</p>
                </div>
              )}
            </section>
            <section className="rounded-3xl border border-cyan-300/20 bg-[#11182e]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">2. Choose your IDE</h2>
              <div className="space-y-5">
                <div aria-live="polite" className={`rounded-xl border p-4 text-sm ${options ? 'border-emerald-400/30 bg-emerald-950/20' : 'border-amber-400/40 bg-amber-950/30'}`}>
                  <p className="font-semibold">{optionsLoading ? 'Connecting to Coder…' : options ? 'Coder connected' : 'Waiting for Coder connection'}</p>
                  {options && <p className="mt-1">Template: {options.templateName}</p>}
                  {optionsError && <p role="alert" className="mt-2">{optionsError} Your choices remain saved. Launch stays disabled.</p>}
                  {!options && !optionsLoading && <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 w-full rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950">Retry Coder connection</button>}
                </div>
                {options && options.images.length > 0 && (
                  <div>
                    <label htmlFor="ide-image" className="mb-1 block text-sm font-medium">IDE environment</label>
                    <select id="ide-image" value={ideImage} onChange={(event) => setIdeImage(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">
                      {options.images.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Only administrator-approved images. Windows desktops require a separate Windows host.</p>
                  </div>
                )}
                <div><label htmlFor="workspace-name" className="mb-1 block text-sm font-medium">Workspace name</label><input id="workspace-name" required minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" value={name} onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label htmlFor="workspace-cpu" className="mb-1 block text-sm">CPU</label><select id="workspace-cpu" value={options ? cpu : ''} disabled={!options} onChange={(event) => setCpu(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3 disabled:opacity-60">{options ? options.cpu.map((item) => <option key={item.value} value={item.value}>{item.label}</option>) : <option value="">Waiting for Coder</option>}</select></div>
                  <div><label htmlFor="workspace-memory" className="mb-1 block text-sm">Memory</label><select id="workspace-memory" value={options ? memory : ''} disabled={!options} onChange={(event) => setMemory(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3 disabled:opacity-60">{options ? options.memory.map((item) => <option key={item.value} value={item.value}>{item.label}</option>) : <option value="">Waiting for Coder</option>}</select></div>
                </div>
                {options && (options.regions.length ? <div><label htmlFor="workspace-region" className="mb-1 block text-sm">Region</label><select id="workspace-region" value={region} onChange={(event) => setRegion(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{options.regions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div> : <p className="text-xs text-slate-400">Location is determined by the existing Coder cluster.</p>)}
                {!options && <p className="text-xs text-slate-300">CPU, RAM and IDE choices come from your published Coder template; no resources are reserved while disconnected.</p>}
                <CoderAvailabilityIndicator>
                  <button type="submit" disabled={!launchReady} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"><Rocket className="mr-2 inline" size={18} /> Create my private IDE</button>
                </CoderAvailabilityIndicator>
                {!launchReady && <p className="text-xs text-slate-300">Launch requires a working Coder connection, a workspace name and supported options.</p>}
              </div>
              {stage === 'error' && <p role="alert" className="mt-4 rounded-xl border border-rose-300/30 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</p>}
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
