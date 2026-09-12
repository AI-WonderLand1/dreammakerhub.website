'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cloud, Github, LockKeyhole, Mail } from 'lucide-react';
import { createClient, ensureSupabaseConfig } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const AUTH_CONFIG_ERROR = 'Authentication service is temporarily unavailable. Please refresh and try again.';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/dashboard';
  }
  return trimmed;
}

async function getConfiguredAuthClient() {
  const config = await ensureSupabaseConfig();
  if (!config) return null;
  return createClient();
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'));
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const callbackError = searchParams.get('error');
    if (!callbackError) return;
    const messages: Record<string, string> = {
      oauth_provider_error: 'The OAuth provider rejected the sign-in request.',
      oauth_code_missing: 'The OAuth sign-in response was incomplete. Please try again.',
      oauth_session_exchange_failed: 'Unable to create a login session from the OAuth response.',
      oauth_callback_failed: 'OAuth sign-in could not be completed. Please try again.',
    };
    setMessage(messages[callbackError] || 'Authentication failed. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    getConfiguredAuthClient()
      .then((supabase) => {
        if (cancelled || !supabase) return;
        return supabase.auth.getUser().then(({ data: { user: verified }, error }) => {
          if (!cancelled && !error && verified) window.location.href = redirectTo;
        });
      })
      .catch((error) => logger.error('[auth] Authentication initialization failed:', error));

    return () => {
      cancelled = true;
    };
  }, [redirectTo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const supabase = await getConfiguredAuthClient();
      if (!supabase) {
        setMessage(AUTH_CONFIG_ERROR);
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          logger.error('[auth] Supabase sign-up failed:', error.message);
          setMessage(error.message);
          return;
        }
        setMessage('Check your email for the confirmation link.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logger.error('[auth] Supabase password sign-in failed:', error.message);
        setMessage(error.message);
        return;
      }

      window.location.href = redirectTo;
    } catch (error) {
      logger.error('[auth] Unexpected authentication failure:', error);
      setMessage('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setMessage('');
    setLoading(true);

    try {
      const supabase = await getConfiguredAuthClient();
      if (!supabase) {
        setMessage(AUTH_CONFIG_ERROR);
        return;
      }

      const callbackUrl = new URL('/api/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      });

      if (error) {
        logger.error(`[auth] ${provider} OAuth failed:`, error.message);
        setMessage(error.message);
      }
    } catch (error) {
      logger.error(`[auth] Unexpected ${provider} OAuth failure:`, error);
      setMessage('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07101d] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(79,70,229,.35),transparent_36%),radial-gradient(circle_at_20%_20%,rgba(168,85,247,.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(155deg,transparent_45%,rgba(30,41,59,.8)_46%,rgba(2,6,23,.95)_65%)] opacity-70" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-500 shadow-2xl shadow-violet-950/50">
            <Cloud size={34} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Dream<span className="text-fuchsia-400">Maker</span><span className="text-blue-400">Hub</span></h1>
          <p className="mt-1 text-sm text-slate-400">Build Tomorrow, Together</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0b1626]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-6 grid grid-cols-2 border-b border-white/10 text-sm">
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(''); }}
              className={`border-b-2 px-3 py-3 font-semibold ${mode === 'signin' ? 'border-blue-500 text-white' : 'border-transparent text-white/45'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setMessage(''); }}
              className={`border-b-2 px-3 py-3 font-semibold ${mode === 'signup' ? 'border-blue-500 text-white' : 'border-transparent text-white/45'}`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold">{mode === 'signin' ? 'Welcome Back' : 'Create your account'}</h2>
            <p className="mt-1 text-sm text-white/45">
              {mode === 'signin' ? 'Sign in to continue building.' : 'Create an account, then choose your first project.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="relative block">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={17} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/[.035] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/70"
                required
              />
            </label>
            <label className="relative block">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={17} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/[.035] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/70"
                required
              />
            </label>

            {message && <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Working...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] text-white/30">
            <span className="h-px flex-1 bg-white/10" /> or continue with <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => void handleOAuth('google')}
              disabled={loading}
              className="rounded-lg border border-white/15 bg-white/[.025] px-4 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => void handleOAuth('github')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[.025] px-4 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
            >
              <Github size={16} /> Continue with GitHub
            </button>
          </div>
        </section>

        <div className="mt-6 flex justify-center gap-6 text-[11px] text-white/30">
          <a href="/terms" className="hover:text-white/60">Terms</a>
          <a href="/privacy" className="hover:text-white/60">Privacy</a>
          <a href="/support" className="hover:text-white/60">Help</a>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07101d]" />}>
      <AuthPageContent />
    </Suspense>
  );
}
