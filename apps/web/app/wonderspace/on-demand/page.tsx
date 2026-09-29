'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient, ensureSupabaseConfig } from '@/lib/supabase/client';

type Workspace = {
  id: string; name: string;
  state: 'stopped' | 'starting' | 'running' | 'saving' | 'needs_reconciliation';
  expiresAt?: string | null;
  lastSavedAt?: string | null;
  snapshotVersion: number;
  error?: string | null;
};
const AUTH_URL = '/public-pages/auth?redirectTo=%2Fwonderspace%2Fon-demand';
export default function OnDemandWonderSpace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newName, setNewName] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'signin' | 'unavailable'>('loading');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState<string | null>(null);

  const token = useCallback(async () => {
    await ensureSupabaseConfig();
    const supabase = createClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    return error || !user ? null : session.access_token;
  }, []);
  const refresh = useCallback(async (quiet = false) => {
    try {
      const access = await token();
      if (!access) { setState('signin'); return; }
      const response = await fetch('/api/wonderspace/sandboxes', {
        cache: 'no-store', headers: { Authorization: 'Bearer ' + access },
      });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { setState('signin'); return; }
      if (!response.ok || !Array.isArray(body?.workspaces)) {
        if (!quiet) setMessage(body?.error || 'Customer IDEs are not enabled yet.');
        setState('unavailable');
        return;
      }
      setWorkspaces(body.workspaces);
      setState('ready');
    } catch {
      if (!quiet) setMessage('Could not check your WonderSpace workspaces.');
      setState('unavailable');
    }
  }, [token]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(true); }, 7000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  // A single authenticated click can start and open the same isolated VM.
  // The controller alone enforces owner ID, one-running-VM and budget limits.
  const sendAction = async (access: string, id: string, actionName: 'start' | 'stop' | 'ticket') => {
    const response = await fetch('/api/wonderspace/sandboxes/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + access, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Workspace operation unavailable');
    return result;
  };

  const openTicket = async (access: string, id: string) => {
    const result = await sendAction(access, id, 'ticket');
    if (typeof result?.url !== 'string') throw new Error('IDE sign-in link missing.');
    const next = new URL(result.url);
    if (next.protocol !== 'https:' || !/^[a-z0-9-]+\.up\.railway\.app$/i.test(next.hostname) ||
        next.pathname !== '/auth/start') throw new Error('Unexpected IDE address');
    window.location.assign(next.href);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(name) || working) {
      setMessage('Choose a unique lowercase workspace name of 3–32 characters.');
      return;
    }
    setWorking('create'); setMessage('');
    try {
      const access = await token();
      if (!access) { setState('signin'); return; }
      const response = await fetch('/api/wonderspace/sandboxes', {
        method: 'POST', headers: {
          Authorization: 'Bearer ' + access, 'Content-Type': 'application/json',
        }, body: JSON.stringify({ name }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.workspace?.id) throw new Error(body?.error || 'Could not create workspace');
      setNewName('');
      await refresh(true);
      // Keep this freshly created workspace even if the billable start fails.
      // Never silently create a replacement or retry a paid start.
      setWorking('launch');
      try {
        const started = await sendAction(access, body.workspace.id, 'start');
        if (started?.workspace?.state !== 'running') throw new Error('Workspace is still preparing.');
        await openTicket(access, body.workspace.id);
      } catch (cause) {
        setMessage('Workspace saved, but opening failed: ' +
          (cause instanceof Error ? cause.message : 'Try Resume & open.'));
        await refresh(true);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not create workspace.');
    } finally { setWorking(null); }
  };
  const action = async (workspace: Workspace, what: 'start' | 'stop' | 'ticket') => {
    if (working) return;
    setWorking(workspace.id); setMessage('');
    try {
      const access = await token();
      if (!access) { setState('signin'); return; }
      if (what === 'ticket') {
        await openTicket(access, workspace.id);
        return;
      }
      const body = await sendAction(access, workspace.id, what);
      if (what === 'start') {
        if (body?.workspace?.state !== 'running') throw new Error('Workspace is still preparing.');
        await openTicket(access, workspace.id);
        return;
      }
      if (what === 'stop') setMessage('Your compressed project snapshot has been saved and the VM stopped.');
      await refresh(true);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Workspace unavailable. Refresh before retrying.');
      await refresh(true);
    } finally { setWorking(null); }
  };
  return (
    <main className="min-h-screen bg-[#080d22] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/wonderspace" className="text-sm font-semibold text-cyan-300 hover:underline">
          ← WonderSpace
        </Link>
        <header className="rounded-2xl border border-cyan-500/30 bg-[#101931] p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Private Linux development environments</p>
          <h1 className="mt-2 text-3xl font-bold">WonderSpace · On demand</h1>
          <p className="mt-2 text-slate-300">
            Your own Linux IDE and terminal. Start it from a clean checkpoint; save your project as a
            private compressed snapshot and restore it when you return. No additional IDE password.
          </p>
          <p className="mt-3 text-sm text-amber-200">
            Limited test: one concurrent environment, ten-minute sessions and a fixed monthly compute allowance.
            Save your unsaved editor tabs before stopping or expiry.
          </p>
        </header>
        {state === 'signin' && <p className="rounded-xl border border-white/15 p-5">
          <Link href={AUTH_URL} className="font-semibold text-cyan-300 underline">Sign in to access your private IDE</Link>
        </p>}
        {state === 'loading' && <p role="status">Checking your workspace access…</p>}
        {state === 'unavailable' && <p role="status" className="rounded-xl border border-amber-300/20 p-5 text-amber-200">
          Customer sandbox provisioning is not enabled yet. Your existing browser editor is still available.
          <Link href="/wonderspace/browser" className="ml-2 text-cyan-300 underline">Open browser editor</Link>
        </p>}
        {message && <p role="status" className="rounded-xl border border-white/20 bg-slate-900 p-4">{message}</p>}
        {state === 'ready' && <>
          <form onSubmit={submit} className="rounded-2xl border border-white/15 bg-[#101931] p-6">
            <label htmlFor="sandbox-name" className="block text-sm font-semibold">Create an isolated workspace</label>
            <div className="mt-3 flex flex-wrap gap-3">
              <input id="sandbox-name" value={newName} onChange={event => setNewName(event.target.value)}
                autoComplete="off" placeholder="my-linux-project" maxLength={32}
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-slate-950 px-4 py-3 text-white" />
              <button disabled={!!working} className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
                {working === 'create' || working === 'launch' ? 'Opening…' : 'Create & open IDE'}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Starts one metered ten-minute pilot session. Files persist through private snapshots;
              save open editor tabs before expiry.
            </p>
          </form>
          <div className="space-y-4">
            {workspaces.length === 0 && <p className="text-slate-400">No saved customer workspaces yet.</p>}
            {workspaces.map(workspace => <section key={workspace.id}
              className="rounded-2xl border border-white/15 bg-[#101931] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{workspace.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {workspace.state.replaceAll('_', ' ')} · snapshot {workspace.snapshotVersion}
                  </p>
                  {workspace.lastSavedAt && <p className="mt-1 text-xs text-slate-400">
                    Last compressed save: {new Date(workspace.lastSavedAt).toLocaleString()}
                  </p>}
                  {workspace.state === 'running' && workspace.expiresAt && <p className="mt-1 text-xs text-amber-200">
                    Session expires: {new Date(workspace.expiresAt).toLocaleTimeString()}
                  </p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {workspace.state === 'stopped' && <button disabled={!!working}
                    onClick={() => { void action(workspace, 'start'); }}
                    className="rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">Resume & open</button>}
                  {workspace.state === 'running' && <>
                    <button disabled={!!working} onClick={() => { void action(workspace, 'ticket'); }}
                      className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">
                      Open VS Code
                    </button>
                    <button disabled={!!working} onClick={() => { void action(workspace, 'stop'); }}
                      className="rounded-xl border border-white/30 px-4 py-2 font-semibold text-white disabled:opacity-60">
                      Save gzip &amp; stop
                    </button>
                  </>}
                  {workspace.state === 'needs_reconciliation' && <p className="text-sm text-amber-200">
                    Workspace recovery needs attention. Your saved project has not been deleted.
                  </p>}
                </div>
              </div>
            </section>)}
          </div>
        </>}
      </div>
    </main>
  );
}
