'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Slot = { id: string; workspace_id: string | null; workspace_name: string; state: string; created_at: string };

export default function CoderWorkspaceManager() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/user-workspace/coder', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load workspaces.');
      setSlots(result.slots);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load workspaces.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const remove = async (slot: Slot) => {
    if (slot.state !== 'deleting' && !window.confirm(`Permanently delete ${slot.workspace_name} and its Coder workspace files? This cannot be undone. Stopping it instead keeps your files and allocation.`)) return;
    setWorking(slot.id);
    setNotice('');
    setError('');
    try {
      const response = await fetch(`/api/user-workspace/coder/${encodeURIComponent(slot.id)}`, { method: 'DELETE' });
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
        <p className="mt-3 text-slate-300">Your plan limits allocated workspaces, not monthly launches. Stopped workspaces keep their files and disk allocation. Delete a workspace only when you no longer need its files.</p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/40 p-4 text-red-200">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-lg border border-cyan-400/40 p-4 text-cyan-200">{notice}</p>}
        {loading ? <p className="mt-8 text-slate-300">Checking workspace allocations…</p> : (
          <div className="mt-8 space-y-4">
            {slots.length === 0 && <p className="text-slate-300">No workspaces have been allocated through this launchpad yet.</p>}
            {slots.map((slot) => (
              <section key={slot.id} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <h2 className="text-lg font-semibold">{slot.workspace_name}</h2>
                <p className="mt-1 text-sm text-slate-300">{slot.state === 'reserved' ? 'Provisioning status uncertain. Contact support before retrying.' : slot.state === 'deleting' ? 'Coder deletion pending.' : 'Allocated workspace and persistent storage.'}</p>
                {slot.workspace_id && <button type="button" disabled={working !== null} onClick={() => void remove(slot)} className="mt-4 rounded-lg border border-red-400/50 px-4 py-2 text-sm text-red-200 hover:bg-red-400/10 disabled:opacity-40">{working === slot.id ? 'Checking Coder…' : slot.state === 'deleting' ? 'Check deletion and release slot' : 'Permanently delete workspace'}</button>}
              </section>
            ))}
            <button type="button" onClick={() => void refresh()} className="rounded-lg border border-white/20 px-4 py-2 text-sm">Refresh allocations</button>
          </div>
        )}
      </div>
    </main>
  );
}
