'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { WORKSPACE_PROFILES, type WorkspaceProfileId } from '@/lib/coder/workspace-profiles';

type Setup = { slotId: string; status: string; allocated?: boolean; error?: string; url?: string };
type Source = 'blank' | 'site';
type ExistingProject = { id: string; name: string; tool?: string | null; type?: string | null };
// Use the same persisted project routes as Dashboard. The legacy /projects/[id]
// page reads a different Prisma collection and must not receive _projects IDs.
function siteProjectHref(project: ExistingProject): string {
  const kind = (project.type || project.tool || '').toLowerCase();
  const query = `projectId=${encodeURIComponent(project.id)}`;
  if (['workspace', 'code'].includes(kind)) return `/dashboard/projects/${encodeURIComponent(project.id)}`;
  if (['game', '3d', '3d_scene', 'playcanvas'].includes(kind)) return `/dashboard/3dhub?${query}`;
  if (kind === 'npc') return `/wonder-play?${query}`;
  if (['ai', 'ai_app', 'ai-playground', 'ai_playground'].includes(kind)) return `/dashboard/agents?${query}`;
  return `/wonder-build/builder?${query}`;
}

const names = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
const CUSTOMER_PROFILES = WORKSPACE_PROFILES.filter(
  (profile) => profile.id === 'micro' || profile.id === 'standard',
);

export default function CustomerWorkspaceLaunch({ operatorPreview = false, embedded = false, provisioningEnabled = true }: { operatorPreview?: boolean; embedded?: boolean; provisioningEnabled?: boolean }) {
  const { user, session, loading: authLoading } = useAuth();
  const [workspaceName, setWorkspaceName] = useState('');
  const [machineProfile, setMachineProfile] = useState<WorkspaceProfileId>('micro');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<Source>('blank');
  const [siteProjects, setSiteProjects] = useState<ExistingProject[]>([]);
  const [siteProjectId, setSiteProjectId] = useState('');
  const [siteError, setSiteError] = useState('');
  const selectedSiteProject = siteProjects.find((project) => project.id === siteProjectId);


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

  // Read existing site projects with this customer's own session. Viewing a
  // project is not permission to copy it into an unverified customer pod.
  useEffect(() => {
    if (source !== 'site' || !session?.access_token) return;
    const controller = new AbortController();
    void (async () => {
      setSiteError('');
      try {
        const response = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store', signal: controller.signal,
        });
        const result = await response.json() as { projects?: ExistingProject[]; message?: string };
        if (!response.ok || !Array.isArray(result.projects)) throw new Error(result.message || 'Could not load site projects.');
        if (!controller.signal.aborted) setSiteProjects(result.projects);
      } catch {
        if (!controller.signal.aborted) setSiteError('Could not load your site projects. Check your session.');
      }
    })();
    return () => controller.abort();
  }, [source, session?.access_token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!names.test(workspaceName)) { setError('Use a 3–32 character lowercase workspace name.'); return; }
    if (source === 'site' && !siteProjectId) { setError('Choose one of your AI WONDERLAND projects.'); return; }
    if (operatorPreview || !provisioningEnabled) { setError('Customer workspace creation is paused.'); return; }
    if (loading || setup) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user-workspace/customer/provision', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ workspaceName, machineProfile, projectId: source === 'site' ? siteProjectId : null }),
      });
      const result = await response.json() as Setup;
      if (!response.ok) throw new Error(result.error || 'Workspace creation is paused.');
      if (!result.slotId || !['queued', 'ready', 'needs_reconciliation'].includes(result.status)) {
        throw new Error('Workspace provisioning did not return a verified state.');
      }
      setSetup(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Workspace creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const openWorkspace = async () => {
    if (!setup?.slotId || setup.status !== 'ready' || opening) return;
    setOpening(true);
    setError('');
    try {
      const headers = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined;
      const endpoint = `/api/user-workspace/customer/open/${encodeURIComponent(setup.slotId)}`;

      let response = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers,
      });

      for (let attempt = 0; attempt < 30; attempt += 1) {
        const result = await response.json().catch(() => null) as Setup | null;
        if (response.ok && typeof result?.url === 'string') {
          window.location.assign(result.url);
          return;
        }
        if (!(response.status === 202 || (response.ok && result?.status === 'stopped'))) {
          throw new Error(result?.error || 'Your IDE could not be opened.');
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        response = await fetch(endpoint, {
          method: 'GET',
          cache: 'no-store',
          headers,
        });
      }

      throw new Error('Coder is still starting your workspace. Retry Open private IDE in a moment.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your IDE could not be opened.');
    } finally {
      setOpening(false);
    }
  };

  if (authLoading) return <main className="min-h-screen bg-[#080d22] p-12 text-white">Checking your session…</main>;
  if (!user) return <main className="min-h-screen bg-[#080d22] p-12 text-white"><Link href="/public-pages/auth" className="text-cyan-200 underline">Sign in to WonderSpace</Link></main>;

  // A GitHub-like creation layout without exposing capabilities that the
  // approved private customer template does not yet implement.
  const provisioningPaused = operatorPreview || !provisioningEnabled;
  const content = <div className="mx-auto max-w-3xl">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">AI Wonderland / WonderSpace</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Create a new workspace</h1>
        <p className="mt-2 text-slate-300">Choose where your code starts. We handle workspace naming and machine defaults for you.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard?workspaceTab=code#projects" className="rounded-xl border border-white/20 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:border-cyan-400">
          Manage workspaces
        </Link>
      </div>
    </header>

    {(operatorPreview || !provisioningEnabled) && (
      <p role="status" className="mb-6 rounded-xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 text-sm text-amber-100">
        {operatorPreview
          ? 'Operator preview only. This form cannot create a customer workspace from your production account.'
          : 'New private IDE creation is temporarily paused. You can still browse your projects and manage existing workspaces.'}
      </p>
    )}

    {setup ? (
      <section id="create-workspace" aria-live="polite" className="mt-6 rounded-2xl border border-cyan-400/30 bg-slate-900 p-7">
        <h2 className="text-xl font-semibold">Your workspace setup: {setup.status.replaceAll('_', ' ')}</h2>
        <p className="mt-3 text-slate-300">{setup.status === 'needs_reconciliation'
          ? 'Coder may have created your workspace, but confirmation was interrupted. Contact support. Do not request a replacement.'
          : setup.status === 'ready'
            ? 'Your private Google Docker workspace is ready. It opens directly in your code-server IDE under your verified Coder identity.'
            : 'Coder is preparing your workspace. Do not submit a duplicate request.'}</p>
        {setup.status === 'ready' && (
          <button type="button" onClick={() => void openWorkspace()} disabled={opening}
            className="mt-5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50">
            {opening ? 'Opening IDE…' : 'Open private IDE'}
          </button>
        )}
        <Link className="ml-4 mt-4 inline-block text-sm font-semibold text-cyan-200 underline" href="/dashboard?workspaceTab=code#projects">Manage workspaces</Link>
        {error && <p role="alert" className="mt-3 text-amber-200">{error}</p>}
      </section>
    ) : (
      <form id="create-workspace" onSubmit={submit} className="mt-6 overflow-hidden rounded-2xl border border-white/15 bg-[#121a2d]/95 shadow-xl">
        <div className="border-b border-white/10 px-5 py-5 md:px-7">
          <h2 className="text-xl font-semibold text-white">Start from</h2>
          <p className="mt-1 text-sm text-slate-300">Select a source and a machine, then create. Unavailable imports are clearly marked.</p>
        </div>
        <div className="divide-y divide-white/10">
          <fieldset id="workspace-source" className="scroll-mt-8 px-5 py-6 md:px-7">
            <legend className="text-base font-semibold text-white">Choose a source</legend>
            <p className="mt-1 text-sm text-slate-400">Blank Linux is ready when creation opens. Other sources stay view-only until their secure imports are implemented.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {([
                { id: 'site', label: 'My AI WONDERLAND projects', description: 'Use a project repository stored under this website account.', status: 'Website repository' },
                { id: 'blank', label: 'New blank workspace', description: 'Empty private Linux workspace with no external repository.', status: 'Blank workspace' },
              ] as const).map((option) => (
                <label key={option.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${source === option.id ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/15 bg-slate-950/70'}`}>
                  <input type="radio" name="workspaceSource" checked={source === option.id}
                    onChange={() => { setSource(option.id); setError(''); }}
                    className="mt-1 accent-cyan-400" />
                  <span>
                    <span className="block font-semibold text-white">{option.label}</span>
                    <span className="mt-1 block text-sm text-slate-400">{option.description}</span>
                    <span className="mt-2 inline-block text-xs font-medium text-cyan-200">{option.status}</span>
                  </span>
                </label>
              ))}
            </div>
            {source === 'site' && <div className="mt-4 space-y-3 rounded-xl border border-white/15 bg-slate-950 p-4">
              <label htmlFor="existing-site-project" className="block text-sm font-semibold text-white">Existing site project</label>
              <select id="existing-site-project" value={siteProjectId} onChange={(event) => setSiteProjectId(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white">
                <option value="">Choose a project to inspect</option>
                {siteProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              {siteError && <p role="alert" className="text-sm text-amber-200">{siteError}</p>}
              {selectedSiteProject && <Link href={siteProjectHref(selectedSiteProject)}
                className="inline-block text-sm font-semibold text-cyan-200 underline">Open selected project in its editor</Link>}
              <p className="text-sm text-amber-200">Website projects do not currently transfer into customer Coder workspaces. Browsing them does not allocate a workspace.</p>
            </div>}
            {source === 'site' && <p role="status" className="mt-4 text-sm text-cyan-200">Only repositories owned by this AI WONDERLAND account are accepted by the customer IDE launcher. External GitHub URLs and tokens are not used here.</p>}
          </fieldset>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <label htmlFor="customer-machine-profile" className="font-semibold text-white">Machine type</label>
              <p className="mt-1 text-sm text-slate-400">Select your compute profile. Larger machines consume credits faster.</p>
            </div>
            <div>
              <select id="customer-machine-profile" name="machineProfile" value={machineProfile}
                onChange={(event) => setMachineProfile(event.target.value as WorkspaceProfileId)}
                className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400">
                {CUSTOMER_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} · {profile.cpu} CPU / {profile.memoryGiB} GB · {profile.computeMultiplier}× compute
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">Compute is metered by profile. Persistent home data stays on the workspace's Docker volume. The Google host is operator-controlled; customers cannot choose or override the container image.</p>
            </div>
          </div>
          <details className="px-5 py-4 md:px-7">
            <summary className="cursor-pointer text-sm font-semibold text-cyan-200">Advanced options · Change workspace name</summary>
            <p className="mt-2 text-xs text-slate-400">A private name is generated automatically. You can change it if needed.</p>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:px-7">
            <div>
              <label htmlFor="customer-workspace-name" className="font-semibold text-white">Workspace name (optional)</label>
              <p className="mt-1 text-sm text-slate-400">3–32 lowercase letters, numbers or hyphens.</p>
            </div>
            <input id="customer-workspace-name" name="workspaceName" minLength={3} maxLength={32}
              pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" />
          </div>
            <p className="px-1 pb-2 text-xs text-slate-400">Additional templates (React, Jupyter and Windows) are planned, not yet available for customer IDEs.</p>
          </details>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-950/50 px-5 py-5 md:px-7">
          <p className="max-w-lg text-sm text-slate-400">{provisioningPaused ? 'Existing private workspaces can be managed without creating another one.' : 'Only your verified account can request and manage your private workspace.'}</p>
          <button type="submit" disabled={loading || provisioningPaused || (source === 'site' && !siteProjectId)}
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
