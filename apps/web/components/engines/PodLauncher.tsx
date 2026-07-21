'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { logger } from '@/lib/logger';

type PodType = 'ide' | 'playcanvas';
type ProvisionState = 'form' | 'provisioning' | 'ready' | 'error';

interface PodLauncherProps {
  podType: PodType;
  title: string;
  icon: string;
  description: string;
  templateId: string;
  accentColor?: string;
  backHref?: string;
  backLabel?: string;
}

export default function PodLauncher({
  podType,
  title,
  icon,
  description,
  templateId,
  accentColor = 'blue',
  backHref = '/',
  backLabel = 'Back',
}: PodLauncherProps) {
  const { user, loading } = useAuth();
  const [podName, setPodName] = useState('');
  const [cpu, setCpu] = useState(2);
  const [memory, setMemory] = useState(4);
  const [state, setState] = useState<ProvisionState>('form');
  const [podUrl, setPodUrl] = useState('');
  const [sshCommand, setSshCommand] = useState('');
  const [error, setError] = useState('');

  const defaultPodName = user?.email?.split('@')[0] || `my-${podType}`;
  const effectiveName = podName.trim() || defaultPodName;

  const accent = {
    blue: { ring: 'ring-blue-500', bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-500', text: 'text-blue-400' },
    purple: { ring: 'ring-purple-500', bg: 'bg-purple-600', hover: 'hover:bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
  }[accentColor] || { ring: 'ring-blue-500', bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-500', text: 'text-blue-400' };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('provisioning');
    setError('');

    try {
      const res = await fetch('/api/user-workspace/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podName: effectiveName,
          podType,
          templateId,
          cpu,
          memory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision workspace');
      }

      setPodUrl(data.ideUrl || data.podUrl || '');
      setSshCommand(data.sshCommand || `ssh coder@${data.ideUrl || data.podUrl || ''}`);
      setState('ready');
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
          <p className="text-gray-400 mb-6">Please sign in to launch your private workspace.</p>
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
            <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              {backLabel}
            </Link>
            <div className="text-5xl mb-6 mt-4">{icon}</div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-gray-400 mb-8">{description}</p>

            <form onSubmit={handleProvision} className="space-y-4 text-left">
              <div>
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
                  Lowercase letters, numbers, and hyphens. 3-62 characters.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">CPU</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCpu(c)}
                        className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                          cpu === c
                            ? `${accent.bg} text-white`
                            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Memory (GB)</label>
                  <div className="flex gap-1">
                    {[1, 2, 4, 8].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMemory(m)}
                        className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                          memory === m
                            ? `${accent.bg} text-white`
                            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full ${accent.bg} ${accent.hover} text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-2`}
              >
                Launch Pod
              </button>
            </form>

            <p className="mt-6 text-xs text-gray-600">
              An SSH key will be generated and attached to your pod automatically.
            </p>
          </div>
        )}

        {/* ─── PROVISIONING STATE ──────────────────────────── */}
        {state === 'provisioning' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Creating Your Pod</h1>
            <p className="text-gray-400 mb-2">
              Provisioning <span className="text-white font-mono">{effectiveName}</span>...
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-400">&#10003;</span> SSH key generated
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-400">&#10003;</span> Pod provisioning started
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="animate-pulse text-yellow-400">...</span> Waiting for pod to be ready
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── READY STATE ─────────────────────────────────── */}
        {state === 'ready' && (
          <div className="text-center">
            <div className="text-5xl mb-6">&#10003;</div>
            <h1 className="text-3xl font-bold mb-4">Pod Ready!</h1>
            <p className="text-gray-400 mb-6">Your private workspace is live.</p>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pod</span>
                <span className="font-mono text-white">{effectiveName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type</span>
                <span className="font-mono text-white">{podType === 'playcanvas' ? '3D Editor' : 'IDE'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Resources</span>
                <span className="font-mono text-white">{cpu} CPU / {memory}GB RAM</span>
              </div>
              {sshCommand && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">SSH</span>
                  <span className="font-mono text-xs text-white break-all">{sshCommand}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {podUrl && (
                <a
                  href={podUrl}
                  className={`inline-block ${accent.bg} ${accent.hover} text-white font-semibold py-3 px-6 rounded-lg transition-colors`}
                >
                  Open {podType === 'playcanvas' ? '3D Editor' : 'IDE'}
                </a>
              )}
              {sshCommand && (
                <button
                  onClick={() => navigator.clipboard.writeText(sshCommand)}
                  className="inline-block border border-gray-600 text-gray-300 hover:bg-gray-800 font-medium py-3 px-6 rounded-lg transition-colors text-sm"
                >
                  Copy SSH Command
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── ERROR STATE ─────────────────────────────────── */}
        {state === 'error' && (
          <div className="text-center">
            <div className="text-5xl mb-6">&#9888;</div>
            <h1 className="text-2xl font-bold mb-4">Pod Creation Failed</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => setState('form')}
              className={`${accent.bg} ${accent.hover} text-white font-semibold py-3 px-6 rounded-lg transition-colors`}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
