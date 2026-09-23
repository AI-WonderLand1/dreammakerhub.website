'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { getSupabaseClient } from '@/lib/supabase/client';
import CustomerWorkspaceLaunch from './CustomerWorkspaceLaunch';

type Role = 'checking' | 'operator' | 'customer' | 'unauthorized' | 'error';

const CODER_ORIGIN = 'https://coder.dreammakerhub.website';
const OPERATOR_WORKSPACE_URL = `${CODER_ORIGIN}/@wonderingtribe/production`;
const DREAMMAKERHUB_SIGN_IN = '/public-pages/auth?redirectTo=%2Fwonderspace';

/** The personal operator workspace is never created through the customer form. */
export function OperatorIdePanel() {
  const { session } = useAuth();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);

  async function openProduction() {
    if (opening) return;
    setOpenError('');
    setNeedsSignIn(false);
    setOpening(true);

    try {
      const client = getSupabaseClient();
      // Prefer the latest browser session. The auth context can still contain
      // an older access token after Supabase refreshes it in another tab.
      let accessToken: string | undefined = session?.access_token;
      if (client) {
        const { data } = await client.auth.getSession();
        accessToken = data.session?.access_token || accessToken;
      }
      if (!accessToken) {
        // The cookie-authenticated GET is read-only until it has independently
        // verified the operator; POST must always carry a verified Bearer token.
        window.location.assign('/wonderspace/my-ide');
        return;
      }

      const requestOpen = (token: string) => fetch('/wonderspace/my-ide', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Authorization: `Bearer ${token}` },
      });
      let response = await requestOpen(accessToken);

      if (response.status === 401 && client) {
        // Retry exactly once with a newly issued Supabase session. Never retry
        // with cookies or expose the privileged Coder token to the browser.
        const { data, error } = await client.auth.refreshSession();
        if (!error && data.session?.access_token) {
          response = await requestOpen(data.session.access_token);
        }
      }

      const result = await response.json().catch(() => null) as { url?: unknown; error?: string } | null;
      if (!response.ok) {
        if (response.status === 401) setNeedsSignIn(true);
        throw new Error(response.status === 401
          ? 'Your DreamMakerHub session expired. Sign in again to use this button, or open your IDE directly in Coder.'
          : result?.error || 'The existing IDE could not be opened.');
      }
      if (typeof result?.url !== 'string' || new URL(result.url).origin !== CODER_ORIGIN) {
        throw new Error('Coder returned an unexpected editor address.');
      }
      window.location.assign(result.url);
    } catch (cause) {
      setOpenError(cause instanceof Error ? cause.message : 'The existing IDE could not be opened.');
      setOpening(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d22] px-5 py-12 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(96,76,218,0.4),transparent_42%),radial-gradient(ellipse_at_85%_75%,rgba(18,148,206,0.28),transparent_45%),radial-gradient(ellipse_at_60%_0%,rgba(224,83,197,0.17),transparent_35%)]" />
      <div className="relative mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">← Back to Dashboard</Link>
        <section className="mt-12 rounded-3xl border border-emerald-300/25 bg-[#101931]/90 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">Operator IDE</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Your existing production workspace</h1>
          <p className="mt-4 text-slate-300">
            Open <strong className="text-white">wonderingtribe/production</strong>. If stopped, Coder starts that same workspace and keeps its persistent disk.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => void openProduction()} disabled={opening} className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-center font-semibold text-slate-950 disabled:opacity-60">
              {opening ? 'Opening existing IDE…' : 'Open / start production IDE'}
            </button>
            <a href={OPERATOR_WORKSPACE_URL} className="rounded-xl border border-cyan-300/40 bg-slate-950 px-6 py-3 text-center font-semibold text-cyan-100 hover:bg-slate-800">
              Manage production in Coder
            </a>
          </div>
          {openError && <p role="alert" className="mt-4 text-sm text-amber-200">{openError}</p>}
          {needsSignIn && <Link href={DREAMMAKERHUB_SIGN_IN} className="mt-3 inline-block text-sm font-semibold text-cyan-200 underline">Sign in to DreamMakerHub</Link>}
          <p className="mt-5 text-sm text-slate-400">This button does not create another workspace or change its persistent disk.</p>
        </section>
      </div>
    </main>
  );
}

/** When SSR cookies are missing, do not misclassify an operator as a customer. */
export default function WonderSpaceOperatorGate({ customerPilot }: { customerPilot: boolean }) {
  const { user, session, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role>('checking');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole('unauthorized');
      return;
    }

    const controller = new AbortController();
    setRole('checking');
    fetch('/api/wonderspace/operator', {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    })
      .then(async (response) => {
        if (response.status === 401) return 'unauthorized' as Role;
        if (!response.ok) throw new Error('Operator access could not be checked.');
        const result = await response.json() as { isOperator?: unknown };
        if (typeof result.isOperator !== 'boolean') throw new Error('Invalid operator access response.');
        return result.isOperator ? 'operator' as Role : 'customer' as Role;
      })
      .then((nextRole) => { if (!controller.signal.aborted) setRole(nextRole); })
      .catch(() => { if (!controller.signal.aborted) setRole('error'); });
    return () => controller.abort();
  }, [authLoading, user?.id, session?.access_token, retry]);

  async function retrySessionCheck() {
    const client = getSupabaseClient();
    if (client) {
      // Supabase updates the shared auth context on a successful refresh.
      // A revoked token remains unauthenticated; never infer operator rights.
      try { await client.auth.refreshSession(); } catch { /* Sign-in remains available. */ }
    }
    setRetry((value) => value + 1);
  }

  if (authLoading || role === 'checking') {
    return <main className="min-h-screen bg-[#080d22] p-12 text-center text-white">Checking your DreamMakerHub session…</main>;
  }
  if (role === 'operator') return <OperatorIdePanel />;
  if (role === 'customer' && customerPilot) return <CustomerWorkspaceLaunch />;

  if (role === 'customer') {
    return (
      <main className="min-h-screen bg-[#080d22] p-12 text-center text-white">
        <h1 className="text-2xl font-semibold">Cloud IDE access is private</h1>
        <p className="mx-auto mt-3 max-w-lg text-slate-300">Sign in with the approved operator account to open the existing IDE. This page does not create a customer workspace.</p>
        <Link href={DREAMMAKERHUB_SIGN_IN} className="mt-6 inline-block rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080d22] p-12 text-center text-white">
      <h1 className="text-2xl font-semibold">{role === 'unauthorized' ? 'Sign in to DreamMakerHub' : 'Your session could not be verified'}</h1>
      <p className="mx-auto mt-3 max-w-lg text-slate-300">Your DreamMakerHub session must be verified before WonderSpace access can continue. Customer accounts are never given the operator Coder workspace link.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button type="button" onClick={() => void retrySessionCheck()} className="rounded-lg border border-cyan-300/40 px-5 py-3 text-cyan-200">Retry session check</button>
        <Link href={DREAMMAKERHUB_SIGN_IN} className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950">Sign in to DreamMakerHub</Link>
      </div>
    </main>
  );
}
