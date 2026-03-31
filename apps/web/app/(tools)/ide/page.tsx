'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Breadcrumbs } from '@/app/components/navigation/Breadcrumbs';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { ConfessionsDrawer, type ConfessionEntry } from '@/app/(builder)/wonder-build/components/ConfessionsDrawer';
import { CONFESSIONS_STORAGE_KEY } from '@/app/(builder)/wonder-build/context/SovereignOSContext';

type Status = 'loading' | 'ready' | 'empty' | 'error';

function useStoredConfessions() {
  const [confessions, setConfessions] = useState<ConfessionEntry[]>([]);

  const refresh = useCallback(() => {
    try {
      const raw = localStorage.getItem(CONFESSIONS_STORAGE_KEY);
      setConfessions(raw ? JSON.parse(raw) : []);
    } catch {
      setConfessions([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONFESSIONS_STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return { confessions, refresh };
}

export default function IdeWorkspacePage() {
  const runtimeUrl = useMemo(() => process.env.NEXT_PUBLIC_WONDERSPACE_URL?.trim() ?? '/wonderspace', []);
  const searchParams = useSearchParams();
  const workspace = searchParams.get('workspace')?.trim();
  const projectId = searchParams.get('projectId')?.trim();

  const iframeUrl = useMemo(() => {
    if (!runtimeUrl) return '';
    if (!workspace) return runtimeUrl;
    return `${runtimeUrl}#${encodeURIComponent(`/home/theia/workspaces/${workspace}`)}`;
  }, [runtimeUrl, workspace]);

  const [status, setStatus] = useState<Status>(runtimeUrl ? 'loading' : 'empty');
  const [showConfessions, setShowConfessions] = useState(false);
  const { confessions, refresh } = useStoredConfessions();

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 text-white sm:px-6">
      <PageHeader
        lead={<Breadcrumbs items={[{ href: '/dashboard', label: 'Dashboard' }, { href: '/wonder-build/puck', label: 'Puck Mode' }, { label: 'Code Mode' }]} />}
        title="IDE Code Mode"
        subtitle="Edit repository files in a dedicated code workspace. You can launch a new WonderSpace workspace and jump directly into Theia."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refresh(); setShowConfessions((v) => !v); }}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                showConfessions
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                  : 'border-white/20 bg-white/10 text-white/60 hover:text-white/90'
              }`}
            >
              <span>🤫</span>
              <span>AI Confessions</span>
              {confessions.length > 0 && (
                <span className="rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-200">
                  {confessions.length}
                </span>
              )}
            </button>
            <Link
              href="/wonderspace/ide"
              className="inline-flex h-10 items-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 text-sm font-semibold text-cyan-200"
            >
              Create WonderSpace Workspace
            </Link>
            <Link
              href="/wonder-build/puck"
              className="inline-flex h-10 items-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold"
            >
              Back to Puck Mode
            </Link>
          </div>
        }
      />

      {showConfessions && (
        <section
          className="rounded-xl border border-violet-500/20 bg-[#0a0a10] overflow-hidden"
          style={{ height: '380px' }}
        >
          <ConfessionsDrawer
            confessions={confessions}
            open={showConfessions}
          />
        </section>
      )}

      {workspace ? (
        <section className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          Opening workspace <span className="font-mono">{workspace}</span>{projectId ? <> for project <span className="font-mono">{projectId}</span></> : null}.
        </section>
      ) : null}

      {status === 'loading' ? (
        <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4" aria-busy="true" aria-live="polite">
          <div className="h-5 w-56 animate-pulse rounded bg-gray-400/50" />
          <div className="h-[480px] w-full animate-pulse rounded bg-gray-500/30" />
        </section>
      ) : null}

      {status === 'empty' ? (
        <section className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-sm text-white/75">
          <p className="font-semibold text-white">IDE runtime is not configured.</p>
          <p className="mt-1">Set NEXT_PUBLIC_WONDERSPACE_URL to your Theia host and reload this page.</p>
          <Link href="/wonderspace" className="mt-3 inline-flex h-9 items-center rounded-lg border border-white/20 px-3 text-xs font-semibold">
            Open WonderSpace Guide
          </Link>
        </section>
      ) : null}

      {status === 'error' ? (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Unable to connect to IDE workspace. Verify WonderSpace is running and reachable.
        </div>
      ) : null}

      {iframeUrl ? (
        <iframe
          title="WonderSpace IDE"
          src={iframeUrl}
          className={`h-[680px] w-full rounded-xl border border-white/10 bg-black/30 ${status === 'ready' ? 'block' : 'hidden'}`}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      ) : null}
    </main>
  );
}
