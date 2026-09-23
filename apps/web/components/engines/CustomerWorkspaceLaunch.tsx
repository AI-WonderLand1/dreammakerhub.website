'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { WORKSPACE_PROFILES, type WorkspaceProfileId } from '@/lib/coder/workspace-profiles';

type Setup = { slotId: string; status: string; allocated?: boolean; error?: string };
const names = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export default function CustomerWorkspaceLaunch() {
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

  return <main className="relative min-h-screen bg-[#080d22] px-5 py-12 text-white">
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="text-cyan-200">← Back to Dashboard</Link>
      <h1 className="mt-9 text-4xl font-bold">WonderSpace cloud IDE</h1>
      <p className="mt-3 text-slate-300">Choose your workspace on this page. DreamMakerHub prepares a private pod and persistent disk for your account.</p>
      <Link href="/wonderspace/workspaces" className="mt-3 inline-block text-sm text-cyan-200 underline">Manage existing workspaces</Link>
      {setup ? <section aria-live="polite" className="mt-9 rounded-2xl border border-cyan-400/30 bg-slate-900 p-7">
        <h2 className="text-xl font-semibold">Your workspace setup: {setup.status.replaceAll('_', ' ')}</h2>
        <p className="mt-3 text-slate-300">{setup.status === 'needs_reconciliation'
          ? 'Coder may have created your workspace, but confirmation was interrupted. Contact support. Do not request a replacement.'
          : setup.status === 'ready'
            ? 'Your private workspace is allocated and preserved. Opening is temporarily paused while the DreamMakerHub-only IDE gateway is secured; you will not be sent to the Coder dashboard.'
            : 'The runner is preparing your workspace. Do not submit a duplicate request.'}</p>
        {error && <p role="alert" className="mt-3 text-amber-200">{error}</p>}
      </section> : <form onSubmit={submit} className="mt-9 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/20 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">1. Your project</h2>
          <p className="mt-3 text-slate-300">Start with your approved Linux IDE template and a blank project.</p>
          <label htmlFor="customer-workspace-name" className="mt-6 block text-sm">Workspace name</label>
          <input id="customer-workspace-name" required value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/20 bg-slate-950 p-3" />
        </section>
        <section className="rounded-2xl border border-white/20 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">2. Choose your machine</h2>
          <p className="mt-3 text-sm text-slate-300">Larger machines use your monthly compute pool faster, just like more expensive AI models use more tokens.</p>
          <div className="mt-5 grid gap-3">
            {WORKSPACE_PROFILES.map((profile) => (
              <label key={profile.id} className={`cursor-pointer rounded-xl border p-4 transition ${machineProfile === profile.id ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/15 bg-slate-950/60 hover:border-white/30'}`}>
                <span className="flex items-start gap-3">
                  <input type="radio" name="machine-profile" value={profile.id}
                    checked={machineProfile === profile.id}
                    onChange={() => setMachineProfile(profile.id)}
                    className="mt-1" />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{profile.name}</strong>
                      <span className="text-sm font-semibold text-cyan-200">{profile.computeMultiplier}× compute</span>
                    </span>
                    <span className="mt-1 block text-sm text-slate-200">{profile.cpu} CPU · {profile.memoryGiB} GB RAM</span>
                    <span className="mt-1 block text-xs text-slate-400">{profile.description}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-300">1 compute credit = 1 CPU-minute. Persistent home disk: 10 GiB.</p>
          <button type="submit" disabled={loading} className="mt-5 w-full rounded-lg bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-50">
            {loading ? 'Reserving your workspace…' : 'Create my private IDE'}
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-amber-200">{error}</p>}
        </section>
      </form>}
    </div>
  </main>;
}
