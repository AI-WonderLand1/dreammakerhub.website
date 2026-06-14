'use client';


import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@lib/supabase/auth-context';
import Link from 'next/link';

function AuthPageContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithOAuth, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get('redirectTo') ||
    (isSignUp ? '/subscription?redirectTo=/wonder-build?startAI=true' : '/dashboard/projects');

  useEffect(() => {
    if (!authLoading && user) {
      const target = searchParams.get('redirectTo') || '/dashboard/projects';
      window.location.href = target;
    }
  }, [authLoading, user, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let authError;

    try {
      const res = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      authError = res?.error;
    } catch (e: any) {
      authError = e instanceof Error ? e : new Error(String(e));
    }

if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // If this was a registration, route the user to the subscription flow first.
      if (isSignUp) {
        // If the page already provided a redirectTo, ensure we add the startAI param to the final builder redirect
        const supplied = searchParams.get('redirectTo');
        let targetBuilder = '/wonder-build?startAI=true';
        if (supplied) {
          try {
            const decoded = decodeURIComponent(supplied);
            targetBuilder = decoded.includes('/wonder-build')
              ? (decoded.includes('?') ? `${decoded}&startAI=true` : `${decoded}?startAI=true`)
              : '/wonder-build?startAI=true';
          } catch (err) {
            // fallback
            targetBuilder = supplied;
          }
        }

        window.location.href = `/subscription?redirectTo=${encodeURIComponent(targetBuilder)}`;
        return;
      }

      window.location.href = redirectTo;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <span className="text-white text-2xl font-bold">AI Wonderland</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400">
            {isSignUp ? 'Start building with AI' : 'Sign in to continue'}
          </p>
          {redirectTo !== '/dashboard/projects' && (
            <p className="text-fuchsia-400 text-sm mt-2">
              Sign in to access {redirectTo.replace('/', '')}
            </p>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/50 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const result = await signInWithOAuth('github');
                  if (result?.error) {
                    setError(result.error.message);
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.385.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.361-1.338-1.361-1.338-.884.618.07.606.07.606 1.003.963 1.528 2.145 1.528 2.145.956 1.636 2.502 1.164.3-.637.114-1.095-.378-1.42-1.374-4.697-.535-9.6-2.353-9.6-10.455 0-2.371 1.305-4.352 3.123-5.242-.303-.748-.636-3.354.114-4.384 0 0 2.568-.824 8.395 3.17a9.14 9.14 0 0 1 8.395-3.17c.75 1.03.419 3.636.114 4.384 1.818.89 3.123 2.613 3.123 5.242 0 8.112-4.93 9.6-10.455.636.497 1.233 1.134 1.42 1.374.636.636 1.102 1.418.793 1.577 0 .316-.151.794-.527.793-.577C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const result = await signInWithOAuth('google');
                  if (result?.error) {
                    setError(result.error.message);
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.86a5.03 5.03 0 0 1-2.16 3.19v2.68h3.49c2.05-1.89 3.23-4.67 3.23-7.88z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.5-2.68c-.98.66-2.23 1.05-3.78 1.05-2.91 0-5.37-1.97-6.25-4.62-.32-.63-.5-1.34-.5-2.08s.18-1.45.5-2.08c.88-2.65 3.34-4.62 6.25-4.62 1.88 0 3.57.72 4.84 1.9l3.64-3.64C17.17 2.54 14.82 1.5 12 1.5 7.03 1.5 3 5.53 3 10.5s4.03 9 9 9z"/>
                  <path d="M3.75 6.97C2.98 8.4 2.5 10.1 2.5 12s.48 3.6 1.25 5.03l3.64-3.63c-.16-.94-.25-1.91-.25-2.9s.09-1.96.25-2.9l-3.64-3.64z"/>
                  <path d="M12 22.5c2.82 0 5.17-1.04 7.28-2.65l-3.5-2.68c-.98.66-2.23 1.05-3.78 1.05-2.91 0-5.37-1.97-6.25-4.62-.32-.63-.5-1.34-.5-2.08s.18-1.45.5-2.08c.88-2.65 3.34-4.62 6.25-4.62 1.88 0 3.57.72 4.84 1.9l3.64-3.64C17.17 2.54 14.82 1.5 12 1.5 7.03 1.5 3 5.53 3 10.5s4.03 9 9 9z" fill="#4285F4"/>
                </svg>
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-fuchsia-400 hover:text-fuchsia-300 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to home
          </Link>
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
