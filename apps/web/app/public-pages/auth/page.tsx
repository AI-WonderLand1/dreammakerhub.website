'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@lib/supabase/auth-context';
import Link from 'next/link';

function AuthPageContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get('redirectTo') ||
    (isSignUp ? '/subscription?redirectTo=/wonder-build?startAI=true' : '/dashboard/projects');

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

        router.push(`/subscription?redirectTo=${encodeURIComponent(targetBuilder)}`);
        return;
      }

      router.push(redirectTo);
    }
  };

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
