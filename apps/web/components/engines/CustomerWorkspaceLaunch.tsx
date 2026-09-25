'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { WORKSPACE_PROFILES, type WorkspaceProfileId } from '@/lib/coder/workspace-profiles';

type Setup = { slotId: string; status: string; allocated?: boolean; error?: string };
const names = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export default function CustomerWorkspaceLaunch({ operatorPreview = false, embedded = false, provisioningEnabled = true }: { operatorPreview?: boolean; embedded?: boolean; provisioningEnabled?: boolean }) {
  const { user, session, loading: authLoading } = useAuth();
  const [workspaceName, setWorkspaceName] = useState('');
  const [machineProfile, setMachineProfile] = useState<WorkspaceProfileId>('micro');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !workspaceName) setWorkspaceName(`ws-${user.id.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`);
  }, [user?.id]);

  useEffect(() => {
    if (!setup?.slotId || ['ready', 'needs_reconciliation'].includes(setup.status)) return;
    const controller = new AbortController();
    const poll = async () => {
      try {
        const response = await fetch(`/api/user-workspace/customer/status/${encodeURIComponent(setup.slotId)}`, {
          cache: 'no-store', signal: controller.signal, headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
        const result = await response.json() as Setup;
        if (!response.ok) throw new Error(result.error || 'Unable to check setup.');
        if (!controller.signal.aborted) { setSetup(result); setError(''); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to check setup.');
      }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 3000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [setup?.slotId, setup?.status, session?.access_token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!names.test(workspaceName)) { setError('Use a 3–32 character lowercase workspace name.'); return; }
    if (operatorPreview || !provisioningEnabled) { setError('Customer workspace creation is paused.'); return; }
    if (loading || setup) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user-workspace/customer/provision', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ workspaceName, machineProfile }),
      });
      const result = await response.json() as Setup;
      if (!response.ok) throw new Error(result.error || 'Workspace creation is paused.');
      if (!result.slotId || result.status !== 'queued') throw new Error('The job queue did not confirm this request.');
      setSetup(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Workspace creation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <main className="min-h-screen bg-[#080d22] p-12 text-white">Checking your session…</main>;
  if (!user) return <main className="min-h-screen bg-[#080d22] p-12 text-white"><Link href="/public-pages/auth" className="text-cyan-200 underline">Sign in to WonderSpace</Link></main>;

  // A GitHub-like creation layout without exposing capabilities that the
  // approved private customer template does not yet implement.
  const provisioningPaused = operatorPreview || !provisioningEnabled;
  const plannedTemplates = [
    { name: 'React', detail: 'Application starter', symbol: '⚛' },
    { name: 'Jupyter', detail: 'Notebook environment', symbol: '◈' },
    { name: 'Windows', detail: 'Windows environment', symbol: '▦' },
  ];

  const content = <div className="mx-auto max-w-6xl">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">AI Wonderland / WonderSpace</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Your cloud development environment</h1>
        <p className="mt-2 text-slate-300">Choose a starter and machine on one page. Your private workspace stays under your account.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/wonderspace/workspaces" className="rounded-xl border border-white/20 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:border-cyan-400">
          Manage workspaces
        </Link>
        <a href="#create-workspace" className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400">
          Create workspace
        </a>
      </div>
    </header>

    {(operatorPreview || !provisioningEnabled) && (
      <p role="status" className="mb-6 rounded-xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 text-sm text-amber-100">
        {operatorPreview
          ? 'Operator preview only. This form cannot create a customer workspace from your production account.'
          : 'Customer workspace creation is temporarily paused while private identity, pod isolation, and compute controls are verified.'}
      </p>
    )}

    <section aria-labelledby="workspace-starters" className="rounded-2xl border border-white/15 bg-[#121a2d]/95 p-5 shadow-xl md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="workspace-starters" className="text-lg font-semibold text-white">Quick start templates</h2>
        <span className="text-xs font-medium text-cyan-200">Customer-approved templates only</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border-2 border-cyan-400 bg-cyan-500/10 p-5" aria-label="Blank Linux template selected">
          <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-xl font-bold text-slate-950">+</span>
          <h3 className="mt-4 font-semibold text-white">Blank Linux</h3>
          <p className="mt-2 min-h-12 text-sm text-slate-300">Your approved private Linux IDE, ready for a new project.</p>
          <span className="mt-4 inline-block rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950">Selected</span>
        </div>
        {plannedTemplates.map((template) => (
          <div key={template.name} aria-disabled="true" className="rounded-xl border border-white/15 bg-slate-950/70 p-5 opacity-70">
            <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-2xl text-white">{template.symbol}</span>
            <h3 className="mt-4 font-semibold text-white">{template.name}</h3>
            <p className="mt-2 min-h-12 text-sm text-slate-300">{template.detail}</p>
            <span className="mt-4 inline-block rounded-lg border border-white/20 px-3 py-1.5 text-sm text-slate-300">Planned</span>
          </div>
        ))}
      </div>
    </section>

    {setup ? (
      <section id="create-workspace" aria-live="polite" className="mt-6 rounded-2xl border border-cyan-400/30 bg-slate-900 p-7">
        <h2 className="text-xl font-semibold">Your workspace setup: {setup.status.replaceAll('_', ' ')}</h2>
        <p className="mt-3 text-slate-300">{setup.status === 'needs_reconciliation'
          ? 'Coder may have created your workspace, but confirmation was interrupted. Contact support. Do not request a replacement.'
          : setup.status === 'ready'
            ? 'Your private workspace is allocated and preserved. Opening is temporarily paused while the DreamMakerHub-only IDE gateway is secured; you will not be sent to the Coder dashboard.'
            : 'The runner is preparing your workspace. Do not submit a duplicate request.'}</p>
        <Link className="mt-4 inline-block text-sm font-semibold text-cyan-200 underline" href="/wonderspace/workspaces">Manage workspaces</Link>
        {error && <p role="alert" className="mt-3 text-amber-200">{error}</p>}
      </section>
    ) : (
      <form id="create-workspace" onSubmit={submit} className="mt-6 overflow-hidden rounded-2xl border border-white/15 bg-[#121a2d]/95 shadow-xl">
        <div className="border-b border-white/10 px-5 py-5 md:px-7">
          <h2 className="text-xl font-semibold text-white">Create a new workspace</h2>
          <p className="mt-1 text-sm text-slate-300">One form. The agent handles private workspace setup after the request is approved.</p>
        </div>
        <div className="divide-y divide-white/10">
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <label htmlFor="customer-workspace-name" className="font-semibold text-white">Workspace name</label>
              <p className="mt-1 text-sm text-slate-400">3–32 lowercase letters, numbers or hyphens.</p>
            </div>
            <input id="customer-workspace-name" name="workspaceName" required minLength={3} maxLength={32}
              pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" />
          </div>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <span className="font-semibold text-white">Repository</span>
              <p className="mt-1 text-sm text-slate-400">Start blank today. Repository import needs an approved customer template first.</p>
            </div>
            <div className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-slate-300" aria-label="Blank workspace; repository import unavailable">
              Blank workspace <span className="float-right text-xs text-amber-200">Import planned</span>
            </div>
          </div>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <span className="font-semibold text-white">Branch</span>
              <p className="mt-1 text-sm text-slate-400">Available when repository import is supported.</p>
            </div>
            <div className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-slate-500" aria-label="Branch unavailable for blank workspace">Not applicable to blank workspace</div>
          </div>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <span className="font-semibold text-white">Region</span>
              <p className="mt-1 text-sm text-slate-400">Assigned by your approved WonderSpace infrastructure.</p>
            </div>
            <div className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-slate-300" aria-label="Automatic region assignment">Automatic</div>
          </div>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <label htmlFor="customer-machine-profile" className="font-semibold text-white">Machine type</label>
              <p className="mt-1 text-sm text-slate-400">Select your compute profile. Larger machines consume credits faster.</p>
            </div>
            <div>
              <select id="customer-machine-profile" name="machineProfile" value={machineProfile}
                onChange={(event) => setMachineProfile(event.target.value as WorkspaceProfileId)}
                className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400">
                {WORKSPACE_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} · {profile.cpu} CPU / {profile.memoryGiB} GB · {profile.computeMultiplier}× compute
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">Compute: 1 credit per CPU-minute. Persistent home disk: 10 GiB.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-950/50 px-5 py-5 md:px-7">
          <p className="max-w-lg text-sm text-slate-400">Only your verified account can request and manage your private workspace.</p>
          <button type="submit" disabled={loading || provisioningPaused}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Reserving your workspace…' : provisioningPaused ? 'Creation paused' : 'Create workspace'}
          </button>
        </div>
        {error && <p role="alert" className="px-7 pb-5 text-sm text-amber-200">{error}</p>}
      </form>
    )}
  </div>;

  if (embedded) return <section className="mt-8 border-t border-white/10 pt-8">{content}</section>;
  return <main className="relative min-h-screen bg-[#080d22] px-5 py-12 text-white">{content}</main>;
}
