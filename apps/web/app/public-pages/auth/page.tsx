'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient, ensureSupabaseConfig } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const AUTH_CONFIG_ERROR = 'Authentication service is temporarily unavailable. Please refresh and try again.';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard/projects';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/dashboard/projects';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getConfiguredAuthClient()
      .then((supabase) => {
        if (cancelled) return;
        if (!supabase) {
          logger.error('[auth] Supabase client unavailable after runtime configuration lookup');
          return;
        }

        return supabase.auth.getUser().then(({ data: { user: verified }, error: authError }) => {
          if (!cancelled && !authError && verified) {
            window.location.href = redirectTo;
          }
        });
      })
      .catch((authInitError) => {
        logger.error('[auth] Authentication initialization failed:', authInitError);
      });

    return () => {
      cancelled = true;
    };
  }, [redirectTo]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = await getConfiguredAuthClient();
      if (!supabase) {
        logger.error('[auth] Sign-in blocked because Supabase configuration could not be loaded');
        setError(AUTH_CONFIG_ERROR);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        logger.error('[auth] Supabase password sign-in failed:', signInError.message);
        setError(signInError.message);
        return;
      }

      window.location.href = redirectTo;
    } catch (signInFailure) {
      logger.error('[auth] Unexpected sign-in failure:', signInFailure);
      setError('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = await getConfiguredAuthClient();
      if (!supabase) {
        logger.error('[auth] Sign-up blocked because Supabase configuration could not be loaded');
        setError(AUTH_CONFIG_ERROR);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        logger.error('[auth] Supabase sign-up failed:', signUpError.message);
        setError(signUpError.message);
        return;
      }

      setError('Check your email for the confirmation link.');
    } catch (signUpFailure) {
      logger.error('[auth] Unexpected sign-up failure:', signUpFailure);
      setError('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError('');
    setLoading(true);

    try {
      const supabase = await getConfiguredAuthClient();
      if (!supabase) {
        logger.error(`[auth] ${provider} OAuth blocked because Supabase configuration could not be loaded`);
        setError(AUTH_CONFIG_ERROR);
        return;
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + redirectTo },
      });

      if (oauthError) {
        logger.error(`[auth] ${provider} OAuth failed:`, oauthError.message);
        setError(oauthError.message);
      }
    } catch (oauthFailure) {
      logger.error(`[auth] Unexpected ${provider} OAuth failure:`, oauthFailure);
      setError('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <span className="text-white text-2xl font-bold">AI Wonderland</span>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-gray-400 mb-6">Sign in to continue building</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/50 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => void handleOAuth('github')}
              disabled={loading}
              className="flex-1 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition disabled:opacity-50"
            >
              GitHub
            </button>
            <button
              onClick={() => void handleOAuth('google')}
              disabled={loading}
              className="flex-1 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition disabled:opacity-50"
            >
              Google
            </button>
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            No account?{' '}
            <button onClick={() => void handleSignUp()} disabled={loading} className="text-pink-400 hover:underline disabled:opacity-50">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
