'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import CoderAvailabilityIndicator from './CoderAvailabilityIndicator';
import { Cloud, Rocket, Sparkles } from 'lucide-react';

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
type SavedWorkspace = {
  id: string;
  workspace_id: string | null;
  workspace_name: string;
  state: 'reserved' | 'provisioned' | 'deleting' | 'released';
  created_at: string;
  machine_profile?: string | null;
};
type WorkspaceList = {
  slots?: SavedWorkspace[];
  canOpen?: boolean;
  openMode?: 'operator' | 'customer' | 'disabled';
  error?: string;
};
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
  const [machineProfile, setMachineProfile] = useState('micro');
  const [slotId, setSlotId] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [openingSlotId, setOpeningSlotId] = useState('');
  const [savedWorkspaces, setSavedWorkspaces] = useState<SavedWorkspace[]>([]);
  const [savedWorkspacesLoading, setSavedWorkspacesLoading] = useState(true);
  const [savedWorkspacesError, setSavedWorkspacesError] = useState('');
  const [deletingSlotId, setDeletingSlotId] = useState('');
  const [editingSlotId, setEditingSlotId] = useState('');
  const [editingProfile, setEditingProfile] = useState('micro');
  const [updatingSlotId, setUpdatingSlotId] = useState('');
  const deletionReconcileInFlight = useRef(false);

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

  const refreshSavedWorkspaces = async () => {
    if (!user) return;
    setSavedWorkspacesLoading(true);
    setSavedWorkspacesError('');
    try {
      const response = await fetch('/api/user-workspace/coder', {
        cache: 'no-store',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data = await response.json().catch(() => null) as WorkspaceList | null;
      if (!response.ok) throw new Error(data?.error || 'Unable to load your IDEs.');
      setSavedWorkspaces(Array.isArray(data?.slots) ? data!.slots! : []);
    } catch (cause) {
      setSavedWorkspacesError(cause instanceof Error ? cause.message : 'Unable to load your IDEs.');
    } finally {
      setSavedWorkspacesLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void refreshSavedWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session?.access_token]);


  // A Coder delete request is asynchronous. Keep verifying every slot already
  // marked deleting until Coder reports the exact workspace is gone and the
  // server releases the saved allocation. This also repairs deletions that
  // were started in an earlier browser session.
  useEffect(() => {
    const deleting = savedWorkspaces.filter((workspace) => workspace.state === 'deleting');
    if (!user || deleting.length === 0 || deletionReconcileInFlight.current) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || deletionReconcileInFlight.current) return;
      deletionReconcileInFlight.current = true;

      void (async () => {
        let shouldRefresh = false;
        let failure = '';
        try {
          for (const workspace of deleting) {
            if (cancelled) return;
            const response = await fetch(`/api/user-workspace/coder/${encodeURIComponent(workspace.id)}`, {
              method: 'DELETE',
              cache: 'no-store',
              headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            });
            const data = await response.json().catch(() => null) as { deleted?: boolean; message?: string; error?: string } | null;

            if (response.ok || response.status === 202) {
              shouldRefresh = true;
              continue;
            }

            failure = data?.error || `Could not finish deleting ${workspace.workspace_name}.`;
            break;
          }
        } catch (cause) {
          failure = cause instanceof Error ? cause.message : 'Could not finish workspace deletion.';
        } finally {
          deletionReconcileInFlight.current = false;
        }

        if (cancelled) return;
        if (failure) {
          setSavedWorkspacesError(failure);
          return;
        }
        if (shouldRefresh) await refreshSavedWorkspaces();
      })();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // refreshSavedWorkspaces intentionally stays out of dependencies; a fresh
    // workspace list causes the next reconciliation pass when Coder still
    // reports deletion in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedWorkspaces, user?.id, session?.access_token]);


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
        void refreshSavedWorkspaces();
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
      if (data.status === 'ready') {
        setStage('ready');
        void refreshSavedWorkspaces();
      }
      else if (data.status === 'needs_reconciliation') {
        throw new Error('Coder may have created the workspace but confirmation was interrupted. Contact support before retrying.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Workspace could not be created.');
      setStage('error');
    }
  };

  const deleteWorkspace = async (workspace: SavedWorkspace) => {
    if (deletingSlotId || workspace.state === 'deleting') return;
    if (!window.confirm(`Delete ${workspace.workspace_name}? This removes the Coder workspace and its saved IDE allocation.`)) return;

    setDeletingSlotId(workspace.id);
    setSavedWorkspacesError('');
    try {
      const response = await fetch(`/api/user-workspace/coder/${encodeURIComponent(workspace.id)}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data = await response.json().catch(() => null) as { deleted?: boolean; message?: string; error?: string } | null;
      if (!response.ok && response.status !== 202) {
        throw new Error(data?.error || 'Workspace could not be deleted.');
      }

      if (response.status === 202) {
        setSavedWorkspaces((current) => current.map((item) => (
          item.id === workspace.id ? { ...item, state: 'deleting' } : item
        )));
      }

      await refreshSavedWorkspaces();
    } catch (cause) {
      setSavedWorkspacesError(cause instanceof Error ? cause.message : 'Workspace could not be deleted.');
    } finally {
      setDeletingSlotId('');
    }
  };

  const updateWorkspaceResources = async (workspace: SavedWorkspace) => {
    if (updatingSlotId) return;
    setUpdatingSlotId(workspace.id);
    setSavedWorkspacesError('');
    try {
      const response = await fetch(`/api/user-workspace/coder/${encodeURIComponent(workspace.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ machineProfile: editingProfile }),
      });
      const data = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok && response.status !== 202) {
        throw new Error(data?.error || 'Workspace resources could not be updated.');
      }
      setEditingSlotId('');
      await refreshSavedWorkspaces();
    } catch (cause) {
      setSavedWorkspacesError(cause instanceof Error ? cause.message : 'Workspace resources could not be updated.');
    } finally {
      setUpdatingSlotId('');
    }
  };

  const openPrivateIde = async (targetSlotId = slotId) => {
    if (!targetSlotId || opening) return;
    setOpening(true);
    setOpeningSlotId(targetSlotId);
    setError('');
    const endpoint = `/api/user-workspace/customer/open/${encodeURIComponent(targetSlotId)}`;
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
      setOpeningSlotId('');
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
    <main className="relative min-h-screen overflow-hidden bg-transparent px-5 py-12 text-white">
      <div className="relative mx-auto max-w-5xl">
        <Link href={projectId ? `/dashboard/projects/${encodeURIComponent(projectId)}` : "/dashboard?workspaceTab=code#projects"} className="text-sm text-slate-300 hover:text-white">← Back to project</Link>
        <div className="mt-10 mb-9 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-500/20"><Sparkles size={31} /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">AI WONDERLAND · Cloud IDE</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WonderSpace launchpad</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Create or reopen a private WonderSpace IDE for this project.</p>
          <Link href={projectId ? `/dashboard/projects/${encodeURIComponent(projectId)}/files` : "/dashboard?workspaceTab=code#projects"} className="mt-3 inline-block text-sm text-cyan-200 underline">{projectId ? "Open project files" : "Choose a project"}</Link>
        </div>
        {stage === 'ready' ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-cyan-300/30 bg-[#101931]/90 p-8 text-center shadow-2xl">
            <Rocket className="mx-auto mb-4 text-cyan-300" size={42} />
            <h2 className="text-2xl font-bold">Your Coder workspace is ready</h2>
            <p className="my-4 text-slate-300">{name}</p>
            <button type="button" onClick={() => void openPrivateIde()} disabled={opening}
              className="block w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold disabled:opacity-50">
              {opening && openingSlotId === slotId ? 'Opening private IDE…' : 'Open private IDE →'}
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
          <>
            <section className="mb-6 rounded-3xl border border-cyan-300/20 bg-[#11182e]/90 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">My IDEs</h2>
                  <p className="mt-1 text-sm text-slate-400">Your created WonderSpace IDEs stay here so you can reopen them later.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshSavedWorkspaces()}
                  disabled={savedWorkspacesLoading}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                >
                  {savedWorkspacesLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {savedWorkspacesError && (
                <p role="alert" className="mt-4 rounded-xl border border-amber-300/30 bg-amber-950/30 p-3 text-sm text-amber-100">
                  {savedWorkspacesError}
                </p>
              )}

              {!savedWorkspacesLoading && !savedWorkspacesError && savedWorkspaces.length === 0 && (
                <p className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-slate-400">
                  No IDEs yet. Create one below and it will stay listed here.
                </p>
              )}

              {savedWorkspaces.length > 0 && (
                <div className="mt-4 grid gap-3">
                  {savedWorkspaces.map((workspace) => (
                    <div key={workspace.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{workspace.workspace_name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {workspace.state === 'provisioned' ? 'Ready' : workspace.state === 'reserved' ? 'Provisioning' : workspace.state}
                          {' · '}
                          Created {new Date(workspace.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openPrivateIde(workspace.id)}
                          disabled={opening || workspace.state !== 'provisioned'}
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {opening && openingSlotId === workspace.id ? 'Opening…' : workspace.state === 'provisioned' ? 'Open IDE' : 'Not ready'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSlotId(editingSlotId === workspace.id ? '' : workspace.id);
                            setEditingProfile(workspace.machine_profile || 'micro');
                          }}
                          disabled={workspace.state !== 'provisioned'}
                          className="rounded-xl border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-40"
                        >
                          Edit resources
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteWorkspace(workspace)}
                          disabled={Boolean(deletingSlotId) || workspace.state === 'reserved' || workspace.state === 'deleting'}
                          className="rounded-xl border border-rose-300/30 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                        >
                          {deletingSlotId === workspace.id || workspace.state === 'deleting' ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                      {editingSlotId === workspace.id && (
                        <div className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-4">
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                            <div>
                              <label htmlFor={`edit-profile-${workspace.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Machine type
                              </label>
                              <select
                                id={`edit-profile-${workspace.id}`}
                                value={editingProfile}
                                onChange={(event) => setEditingProfile(event.target.value)}
                                className="mt-2 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                              >
                                {(options?.machineProfiles || []).map((item) => (
                                  <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                              </select>
                              <p className="mt-2 text-xs text-slate-500">
                                CPU and RAM change with the machine profile. GPU/VRAM is not enabled on the current Google Docker template.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void updateWorkspaceResources(workspace)}
                              disabled={Boolean(updatingSlotId) || !options?.machineProfiles.some((item) => item.value === editingProfile)}
                              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
                            >
                              {updatingSlotId === workspace.id ? 'Updating…' : 'Save changes'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <form onSubmit={provision} className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#11182e]/95 shadow-2xl">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-xl font-semibold">Create a WonderSpace IDE</h2>
                <p className="mt-1 text-sm text-slate-400">Choose your source and machine, then create the workspace.</p>
              </div>

              <div className="space-y-6 p-6">
                <div aria-live="polite" className={`rounded-xl border p-4 text-sm ${options ? 'border-emerald-400/30 bg-emerald-950/20' : 'border-amber-400/40 bg-amber-950/30'}`}>
                  <p className="font-semibold">
                    {optionsLoading
                      ? 'Checking IDE availability…'
                      : options?.ready
                        ? 'Coder connected · ready to create'
                        : options
                          ? 'Coder connected · setup still required'
                          : 'Coder launch options unavailable'}
                  </p>
                  {options && <p className="mt-1 text-slate-300">Configuration: {options.templateName}</p>}
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
                  {optionsError && <p role="alert" className="mt-2">{optionsError} Launch stays disabled.</p>}
                  {!options && !optionsLoading && (
                    <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 rounded-lg bg-amber-300 px-4 py-2 font-bold text-slate-950">
                      Retry
                    </button>
                  )}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="workspace-source" className="text-sm font-semibold">Repository</label>
                  <select
                    id="workspace-source"
                    value={mode}
                    onChange={(event) => { setMode(event.target.value as 'site' | 'blank'); setError(''); }}
                    className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3"
                  >
                    <option value="site" disabled={!projectId}>Current AI WONDERLAND project</option>
                    <option value="blank">Blank workspace</option>
                  </select>
                  <p className="text-xs text-slate-400">
                    {mode === 'site'
                      ? projectId
                        ? 'This project will be used as the workspace source.'
                        : 'Open the IDE from a project page to use a project repository.'
                      : 'Start with an empty private workspace.'}
                  </p>
                </div>

                {options && options.machineProfiles.length > 0 && (
                  <div className="grid gap-2">
                    <label htmlFor="machine-profile" className="text-sm font-semibold">Machine type</label>
                    <select
                      id="machine-profile"
                      value={machineProfile}
                      onChange={(event) => setMachineProfile(event.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3"
                    >
                      {options.machineProfiles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid gap-2">
                  <label htmlFor="workspace-name" className="text-sm font-semibold">Workspace name</label>
                  <input
                    id="workspace-name"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]"
                    value={name}
                    onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full rounded-xl border border-white/20 bg-slate-950 px-4 py-3"
                  />
                </div>

                <div className="grid gap-4 rounded-xl border border-white/10 bg-black/10 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Configuration</p>
                    <p className="mt-1 text-sm font-medium">{options?.templateName || 'Loading…'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                    <p className="mt-1 text-sm font-medium">Existing Coder cluster</p>
                  </div>
                </div>

                <CoderAvailabilityIndicator>
                  <button
                    type="submit"
                    disabled={!launchReady}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Rocket className="mr-2 inline" size={18} /> Create IDE
                  </button>
                </CoderAvailabilityIndicator>

                {!launchReady && (
                  <p className="text-xs text-slate-300">
                    {options?.blockers?.length
                      ? 'Finish the readiness items above before creating the IDE.'
                      : 'Choose a valid source, machine type and workspace name.'}
                  </p>
                )}

                {stage === 'error' && (
                  <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-950/40 p-4 text-sm text-rose-200">
                    {error}
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
