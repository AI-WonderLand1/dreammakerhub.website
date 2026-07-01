'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';

type ProvisionState = 'form' | 'provisioning' | 'ready' | 'error';

export default function WonderSpaceIDE() {
  const { user, loading } = useAuth();
  const [podName, setPodName] = useState('');
  const [state, setState] = useState<ProvisionState>('form');
  const [ideUrl, setIdeUrl] = useState('');
  const [error, setError] = useState('');

  const defaultPodName = user?.email?.split('@')[0] || 'my-ide';

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = podName.trim() || defaultPodName;
    setState('provisioning');
    setError('');

    try {
      const res = await fetch('/api/user-workspace/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podName: name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision workspace');
      }

      setIdeUrl(data.ideUrl);
      setState('ready');

      // Redirect after brief delay so user sees success message
      setTimeout(() => {
        window.location.href = data.ideUrl;
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to access your private IDE workspace.</p>
          <Link
            href="/public-pages/auth"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="w-full max-w-md px-6">

        {/* ─── FORM STATE ──────────────────────────────────── */}
        {state === 'form' && (
          <div className="text-center">
            <div className="text-5xl mb-6">💻</div>
            <h1 className="text-3xl font-bold mb-2">Launch Your IDE</h1>
            <p className="text-gray-400 mb-8">
              Your private cloud workspace with VS Code, terminal, and git — just like GitHub Codespaces.
            </p>

            <form onSubmit={handleProvision} className="space-y-4">
              <div className="text-left">
                <label htmlFor="podName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Pod Name
                </label>
                <input
                  id="podName"
                  type="text"
                  value={podName}
                  onChange={(e) => setPodName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder={defaultPodName}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  maxLength={62}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Lowercase letters, numbers, and hyphens. 3–62 characters.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🚀 Launch Workspace
              </button>
            </form>

            <p className="mt-6 text-xs text-gray-600">
              An SSH key will be generated and attached to your workspace automatically.
            </p>
          </div>
        )}

        {/* ─── PROVISIONING STATE ──────────────────────────── */}
        {state === 'provisioning' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Creating Your Workspace</h1>
            <p className="text-gray-400 mb-2">Provisioning pod <span className="text-white font-mono">{podName || defaultPodName}</span>...</p>
            <p className="text-gray-500 text-sm">Injecting SSH key and configuring environment</p>
            <div className="mt-6 flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── READY STATE ─────────────────────────────────── */}
        {state === 'ready' && (
          <div className="text-center">
            <div className="text-5xl mb-6">✅</div>
            <h1 className="text-3xl font-bold mb-4">Workspace Ready!</h1>
            <p className="text-gray-400 mb-6">Redirecting to your private IDE...</p>
            {ideUrl && (
              <a
                href={ideUrl}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Open IDE Manually
              </a>
            )}
          </div>
        )}

        {/* ─── ERROR STATE ─────────────────────────────────── */}
        {state === 'error' && (
          <div className="text-center">
            <div className="text-5xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Workspace Creation Failed</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => setState('form')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
