'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';

type Slot = { id: string; workspace_id: string | null; workspace_name: string; state: string; created_at: string };
type OpenResult = { status?: string; url?: string; error?: string; message?: string };

export default function CoderWorkspaceManager() {
  const { session } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [canOpen, setCanOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-workspace/coder', { cache: 'no-store', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load workspaces.');
      if (!Array.isArray(result.slots)) throw new Error('Workspace list was invalid.');
      setSlots(result.slots);
      setCanOpen(result.canOpen === true);
      setError('');
    } catch (cause) {
      // A failed read is not evidence that the user has no workspaces.
      // Never leave stale workspace action buttons enabled after a read fails.
      setSlots([]);
      setError(cause instanceof Error ? cause.message : 'Unable to load workspaces.');
      setCanOpen(false);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const openExisting = async (slot: Slot) => {
    if (!canOpen || !slot.workspace_id || slot.state !== 'provisioned' || working) return;
    setWorking(slot.id);
    setError('');
    setNotice('Checking your existing Coder workspace…');
    const endpoint = `/api/user-workspace/coder/${encodeURIComponent(slot.id)}/open`;
    try {
      // POST is a start/reopen action for this ID, never a create request.
      let response = await fetch(endpoint, { method: 'POST', cache: 'no-store', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
      let result = await response.json() as OpenResult;
      if (!response.ok && response.status !== 202) throw new Error(result.error || 'Could not open the existing workspace.');
      for (let attempt = 0; attempt < 24 && response.status === 202; attempt++) {
        setNotice(result.message || 'Waiting for your existing workspace to start…');
        await new Promise<void>((resolve) => window.setTimeout(resolve, 2500));
        response = await fetch(endpoint, { cache: 'no-store', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
        result = await response.json() as OpenResult;
        if (!response.ok && response.status !== 202) throw new Error(result.error || 'Could not verify the workspace.');
      }
      if (response.status === 202 || result.status !== 'running' || !result.url) {
        throw new Error('Coder is still starting this workspace. Refresh and try Open existing IDE again; do not create a replacement.');
      }
      // Coder requires its own authenticated browser session; no API token is sent to the browser.
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reopen the existing workspace.');
      setNotice('');
    } finally {
      setWorking(null);
    }
  };

  const remove = async (slot: Slot) => {
    if (slot.state !== 'deleting' && !window.confirm(`Permanently delete ${slot.workspace_name} and its Coder workspace files? This cannot be undone. Stopping it instead keeps your files and allocation.`)) return;
    setWorking(slot.id);
    setNotice('');
    setError('');
    try {
      const response = await fetch(`/api/user-workspace/coder/${encodeURIComponent(slot.id)}`, { method: 'DELETE', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Coder deletion failed.');
      setNotice(result.message || 'Workspace deletion requested.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not confirm deletion. Your slot remains allocated.');
    } finally {
      setWorking(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#080d22] px-5 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/wonderspace" className="text-sm text-cyan-300 hover:text-white">← WonderSpace launchpad</Link>
        <h1 className="mt-8 text-3xl font-semibold">Your cloud workspaces</h1>
        <p className="mt-3 text-slate-300">Open a workspace you already created without creating another. Stopped workspaces keep their files and disk allocation. A new IDE is created only from the launchpad, within your allowance.</p>
        {!canOpen && !loading && <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">Customer IDE access is paused until separate Coder identities and enforced time limits are verified. Your records remain intact.</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/40 p-4 text-red-200">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-lg border border-cyan-400/40 p-4 text-cyan-200">{notice}</p>}
        {loading ? <p className="mt-8 text-slate-300">Checking workspace allocations…</p> : (
          <div className="mt-8 space-y-4">
            {error && <p className="text-slate-300">Workspace availability could not be verified. This does not mean your files or workspaces have been deleted. Your existing personal Coder IDE is managed separately.</p>}
            {!error && slots.length === 0 && <p className="text-slate-300">No workspaces have been allocated through this launchpad yet. Your existing personal Coder workspace may not be listed here.</p>}
            {slots.map((slot) => (
              <section key={slot.id} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <h2 className="text-lg font-semibold">{slot.workspace_name}</h2>
                <p className="mt-1 text-sm text-slate-300">{slot.state === 'reserved' ? 'Provisioning status uncertain. Contact support before retrying.' : slot.state === 'deleting' ? 'Coder deletion pending.' : 'Allocated workspace and persistent storage.'}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {canOpen && slot.workspace_id && slot.state === 'provisioned' && <button type="button" disabled={working !== null} onClick={() => void openExisting(slot)} className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-40">{working === slot.id ? 'Opening existing IDE…' : 'Open existing IDE'}</button>}
                  {slot.workspace_id && <button type="button" disabled={working !== null} onClick={() => void remove(slot)} className="rounded-lg border border-red-400/50 px-4 py-2 text-sm text-red-200 hover:bg-red-400/10 disabled:opacity-40">{working === slot.id ? 'Checking Coder…' : slot.state === 'deleting' ? 'Check deletion and release slot' : 'Permanently delete workspace'}</button>}
                </div>
              </section>
            ))}
            <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50">Refresh allocations</button>
          </div>
        )}
      </div>
    </main>
  );
}
