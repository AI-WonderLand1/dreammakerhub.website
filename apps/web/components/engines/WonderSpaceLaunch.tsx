'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import CoderAvailabilityIndicator from './CoderAvailabilityIndicator';
import { Cloud, Code2, FolderGit2, Rocket, Sparkles } from 'lucide-react';

type Choice = { label: string; value: string };
type LaunchBlocker = { code: string; message: string; action?: string; href?: string };
type LaunchOptions = {
  templateId: string;
  templateVersionId: string;
  templateName: string;
  machineProfiles: Choice[];
  cpu: Choice[];
  memory: Choice[];
  images: Choice[];
  regions: Choice[];
  repositorySupported: boolean;
  ready: boolean;
  oidcEnabled: boolean;
  blockers: LaunchBlocker[];
};
type Setup = { slotId?: string; status?: string; error?: string; url?: string };
type Stage = 'form' | 'provisioning' | 'ready' | 'error';

function uniqueWorkspaceName(userId: string): string {
  return `ws-${userId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function WonderSpaceLaunch({ projectId }: { projectId?: string | null }) {
  const { user, session, loading: authLoading } = useAuth();
  const [options, setOptions] = useState<LaunchOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [mode, setMode] = useState<'blank' | 'site'>('site');
  const [name, setName] = useState('');
  const [ideImage, setIdeImage] = useState('');
  const [region, setRegion] = useState('');
  const [machineProfile, setMachineProfile] = useState('micro');
  const [slotId, setSlotId] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);

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
        if (!response.ok) {
          const failure = new Error(data.error || 'Coder options unavailable.') as Error & { code?: string };
          failure.code = typeof data.code === 'string' ? data.code : '';
          throw failure;
        }
        return data as LaunchOptions;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.machineProfiles) ||
            !Array.isArray(data.cpu) ||
            !Array.isArray(data.memory) ||
            !Array.isArray(data.regions) ||
            !Array.isArray(data.images) ||
            !Array.isArray(data.blockers)) {
          throw new Error('Coder has not returned usable workspace options.');
        }
        setOptions(data);
        setIdeImage(data.images[0]?.value || '');
        setRegion(data.regions[0]?.value || '');
        setMachineProfile(data.machineProfiles.find((profile) => profile.value === 'micro')?.value || data.machineProfiles[0]?.value || 'micro');
        setOptionsError('');
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setOptionsError(cause instanceof Error ? cause.message : 'Coder options unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });
    return () => controller.abort();
  }, [user?.id, session?.access_token, retryCount]);


  useEffect(() => {
    if (!slotId || stage !== 'provisioning') return;
    const controller = new AbortController();

    const poll = async () => {
      const response = await fetch(`/api/user-workspace/customer/status/${encodeURIComponent(slotId)}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data = await response.json().catch(() => null) as Setup | null;
      if (!response.ok) throw new Error(data?.error || 'Unable to check workspace setup.');
      if (data?.status === 'ready') {
        setStage('ready');
        return;
      }
      if (data?.status === 'needs_reconciliation') {
        setError('Coder may have created the workspace but confirmation was interrupted. Contact support before retrying.');
        setStage('error');
      }
    };

    void poll().catch((cause) => {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Unable to check workspace setup.');
        setStage('error');
      }
    });
    const timer = window.setInterval(() => {
      void poll().catch(() => undefined);
    }, 3000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [slotId, stage, session?.access_token]);

  const provision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!options || optionsLoading || optionsError || !options.ready) {
      setError('Customer IDE prerequisites are not ready yet. Review the readiness items above.');
      setStage('error');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(name)) {
      setError('Enter a valid 3–32 character workspace name.');
      setStage('error');
      return;
    }
    if (mode === 'site' && !projectId) {
      setError('Choose one of your AI WONDERLAND projects before opening the IDE.');
      setStage('error');
      return;
    }
    if (!options.machineProfiles.some((profile) => profile.value === machineProfile)) {
      setError('Choose an approved customer machine profile.');
      setStage('error');
      return;
    }

    setStage('provisioning');
    setError('');
    try {
      const response = await fetch('/api/user-workspace/customer/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ workspaceName: name, machineProfile, projectId: mode === 'site' ? projectId : null }),
      });
      const data = await response.json().catch(() => null) as Setup | null;
      if (!response.ok) throw new Error(data?.error || 'Workspace could not be created.');
      if (!data?.slotId || !data.status) throw new Error('Workspace provisioning returned an invalid response.');
      setSlotId(data.slotId);
      if (data.status === 'ready') setStage('ready');
      else if (data.status === 'needs_reconciliation') {
        throw new Error('Coder may have created the workspace but confirmation was interrupted. Contact support before retrying.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Workspace could not be created.');
      setStage('error');
    }
  };

  const openPrivateIde = async () => {
    if (!slotId || opening) return;
    setOpening(true);
    setError('');
    const endpoint = `/api/user-workspace/customer/open/${encodeURIComponent(slotId)}`;
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;

    try {
      let response = await fetch(endpoint, { method: 'POST', cache: 'no-store', headers });
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const data = await response.json().catch(() => null) as Setup | null;
        if (response.ok && data?.url) {
          window.location.assign(data.url);
          return;
        }
        if (response.status !== 202 && !(response.ok && data?.status === 'stopped')) {
          throw new Error(data?.error || 'Your private IDE could not be opened.');
        }
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        response = await fetch(endpoint, { method: 'GET', cache: 'no-store', headers });
      }
      throw new Error('Coder is still starting your IDE. Try again in a moment.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your private IDE could not be opened.');
    } finally {
      setOpening(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#090d1d] p-16 text-center text-white">Checking your session…</div>;
  if (!user) return (
    <div className="min-h-screen bg-[#090d1d] p-16 text-center text-white">
      <h1 className="mb-6 text-3xl font-bold">Sign in to launch WonderSpace</h1>
      <Link href="/public-pages/auth" className="rounded-xl bg-indigo-600 px-6 py-3">Sign in</Link>
    </div>
  );

  const launchReady = Boolean(options && options.ready && !optionsLoading && !optionsError && name &&
    options.machineProfiles.some((profile) => profile.value === machineProfile) &&
    (mode === 'blank' || (mode === 'site' && projectId)));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d22] px-5 py-12 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(96,76,218,0.4),transparent_42%),radial-gradient(ellipse_at_85_75%,rgba(18,148,206,0.28),transparent_45%),radial-gradient(ellipse_at_60%_0%,rgba(224,83,197,0.17),transparent_35%)]" />
      <div className="relative mx-auto max-w-5xl">
        <Link href={projectId ? `/dashboard/projects/${encodeURIComponent(projectId)}` : "/dashboard?workspaceTab=code#projects"} className="text-sm text-slate-300 hover:text-white">← Back to project</Link>
        <div className="mt-10 mb-9 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-500/20"><Sparkles size={31} /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">AI WONDERLAND · Cloud IDE</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WonderSpace launchpad</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Open your AI WONDERLAND project in a private Coder workspace. External GitHub repositories are not part of this IDE flow.</p>
          <Link href={projectId ? `/dashboard/projects/${encodeURIComponent(projectId)}/files` : "/dashboard?workspaceTab=code#projects"} className="mt-3 inline-block text-sm text-cyan-200 underline">{projectId ? "Open project files" : "Choose a project"}</Link>
        </div>
        {stage === 'ready' ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-cyan-300/30 bg-[#101931]/90 p-8 text-center shadow-2xl">
            <Rocket className="mx-auto mb-4 text-cyan-300" size={42} />
            <h2 className="text-2xl font-bold">Your Coder workspace is ready</h2>
            <p className="my-4 text-slate-300">{name}</p>
            <button type="button" onClick={() => void openPrivateIde()} disabled={opening}
              className="block w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold disabled:opacity-50">
              {opening ? 'Opening private IDE…' : 'Open private IDE →'}
            </button>
            {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
            <button type="button" onClick={() => { setName(uniqueWorkspaceName(user.id)); setSlotId(''); setStage('form'); }} className="mt-5 block w-full text-sm text-slate-400 hover:text-white">Create another workspace</button>
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
                <button type="button" aria-pressed={mode === 'site'} onClick={() => { setMode('site'); setError(''); }} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left ${mode === 'site' ? 'border-violet-400 bg-violet-400/15' : 'border-white/20 bg-white/5'}`}>
                  <FolderGit2 className="text-violet-300" />
                  <span className="flex-1">
                    <strong className="block">AI WONDERLAND project repository</strong>
                    <span className="text-sm text-slate-300">
                      {projectId ? 'Use this website project as the source for your private IDE.' : 'Choose one of your AI WONDERLAND projects first.'}
                    </span>
                  </span>
                </button>
                <button type="button" aria-pressed={mode === 'blank'} onClick={() => { setMode('blank'); setError(''); }} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left ${mode === 'blank' ? 'border-cyan-400 bg-cyan-400/15' : 'border-white/20 bg-white/5'}`}>
                  <Code2 className="text-cyan-300" /><span className="flex-1"><strong className="block">Blank workspace</strong><span className="text-sm text-slate-300">Start with an empty private workspace.</span></span>
                </button>
              </div>
              {mode === 'site' && (
                <div className="mt-6 rounded-xl border border-cyan-300/20 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-cyan-200">Website repository only</p>
                  <p className="mt-1 text-xs text-slate-400">
                    WonderSpace uses the selected AI WONDERLAND project ID. GitHub repositories, GitHub tokens, and external repository URLs are not accepted by this IDE launcher.
                  </p>
                  {!projectId && (
                    <Link href="/dashboard?workspaceTab=code#projects" className="mt-3 inline-block text-sm font-semibold text-cyan-200 underline">
                      Choose a project
                    </Link>
                  )}
                </div>
              )}
            </section>
            <section className="rounded-3xl border border-cyan-300/20 bg-[#11182e]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">2. Choose your IDE</h2>
              <div className="space-y-5">
                <div aria-live="polite" className={`rounded-xl border p-4 text-sm ${options ? 'border-emerald-400/30 bg-emerald-950/20' : 'border-amber-400/40 bg-amber-950/30'}`}>
                  <p className="font-semibold">
                    {optionsLoading
                      ? 'Checking IDE availability…'
                      : options?.ready
                        ? 'Coder connected · customer launch ready'
                        : options
                          ? 'Coder connected · setup still required'
                          : 'Coder launch options unavailable'}
                  </p>
                  {options && <p className="mt-1">Template: {options.templateName}</p>}
                  {options?.blockers?.length ? (
                    <ul className="mt-3 space-y-2 text-left text-xs">
                      {options.blockers.map((blocker) => (
                        <li key={blocker.code} className="rounded-lg border border-amber-300/20 bg-black/20 p-2">
                          <span className="font-semibold">{blocker.message}</span>
                          {blocker.action ? <span className="mt-1 block text-slate-300">{blocker.action}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {optionsError && <p role="alert" className="mt-2">{optionsError} Your choices remain saved. Launch stays disabled.</p>}
                  {!options && !optionsLoading && (
                    <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 w-full rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950">
                      Retry IDE availability check
                    </button>
                  )}
                </div>
                {options && options.machineProfiles.length > 0 && (
                  <div>
                    <label htmlFor="machine-profile" className="mb-1 block text-sm font-medium">Machine profile</label>
                    <select id="machine-profile" value={machineProfile} onChange={(event) => setMachineProfile(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">
                      {options.machineProfiles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Only operator-approved CPU/RAM profiles are available.</p>
                  </div>
                )}
                {options && options.images.length > 0 && (
                  <div>
                    <label htmlFor="ide-image" className="mb-1 block text-sm font-medium">IDE environment</label>
                    <select id="ide-image" value={ideImage} onChange={(event) => setIdeImage(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">
                      {options.images.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Only administrator-approved images. Windows desktops require a separate Windows host.</p>
                  </div>
                )}
                <div><label htmlFor="workspace-name" className="mb-1 block text-sm font-medium">Workspace name</label><input id="workspace-name" required minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]" value={name} onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3" /></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  Google Cloud hosts workspace compute for this Coder Docker template. Choose a published workspace region when one is available.
                </div>
                {options && (options.regions.length ? <div><label htmlFor="workspace-region" className="mb-1 block text-sm">Region</label><select id="workspace-region" value={region} onChange={(event) => setRegion(event.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 p-3">{options.regions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div> : <p className="text-xs text-slate-400">Location is determined by the existing Coder cluster.</p>)}
                {!options && <p className="text-xs text-slate-300">Workspace location and availability come from the published Coder Google template; no workspace is created while disconnected.</p>}
                <CoderAvailabilityIndicator>
                  <button type="submit" disabled={!launchReady} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"><Rocket className="mr-2 inline" size={18} /> Create my private IDE</button>
                </CoderAvailabilityIndicator>
                {!launchReady && (
                  <p className="text-xs text-slate-300">
                    {options?.blockers?.length
                      ? 'Finish the readiness items above. The website will not create a workspace until the live checks pass.'
                      : 'Launch requires verified Coder options, a workspace name and supported settings.'}
                  </p>
                )}
              </div>
              {stage === 'error' && (
                <p role="alert" className="mt-4 rounded-xl border border-rose-300/30 bg-rose-950/40 p-4 text-sm text-rose-200">
                  {error}
                </p>
              )}
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
