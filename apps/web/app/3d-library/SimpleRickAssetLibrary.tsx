'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Download, RefreshCw, WandSparkles } from 'lucide-react';
import { ThreeViewport } from '@/lib/wonder3d/components/ThreeViewport';

type SavedAsset = { id: string; name: string; url: string; projectId?: string; expiresIn: number };

export default function SimpleRickAssetLibrary() {
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [selected, setSelected] = useState<SavedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/3d/assets', { credentials: 'include', cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(response.status === 401 ? 'Log in to view your private models.' : body?.error || 'Unable to load 3D assets');
      const saved = Array.isArray(body?.assets) ? body.assets as SavedAsset[] : [];
      setAssets(saved);
      setSelected((previous) => saved.find((asset) => asset.id === previous?.id) || saved[0] || null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load 3D assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <main className="min-h-screen bg-[#070b13] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-cyan-300">My 3D Asset Library</h1>
            <p className="mt-2 text-sm text-slate-400">Your private generated GLBs, including SimpleRick image-to-3D and existing text-to-3D projects.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className="mr-2 inline h-4 w-4" /> Refresh links
            </button>
            <Link href="/dashboard/ai-generator" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              <WandSparkles className="mr-2 inline h-4 w-4" /> Create 3D
            </Link>
          </div>
        </header>

        {error && <div role="alert" className="rounded-lg border border-amber-700 bg-amber-950/40 p-4 text-amber-200">{error}</div>}
        {loading && <p className="text-slate-400">Loading saved GLBs…</p>}
        {!loading && !error && assets.length === 0 && (
          <div className="rounded-xl border border-slate-800 p-10 text-center">
            <Box className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="font-semibold">No generated models saved yet</p>
            <p className="mt-2 text-sm text-slate-400">Generate an image-to-3D or text-to-3D model to see it here.</p>
          </div>
        )}

        {assets.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <section aria-label="Saved models" className="max-h-[75vh] space-y-2 overflow-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              {assets.map((asset) => (
                <button key={asset.id} type="button" onClick={() => setSelected(asset)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:border-cyan-600 ${selected?.id === asset.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-slate-900/60'}`}>
                  <Box className="h-7 w-7 shrink-0 text-cyan-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{asset.name}</span>
                    <span className="block truncate text-xs text-slate-500">{asset.projectId === 'unassigned' ? 'Personal asset' : `Project: ${asset.projectId || 'Unassigned'}`} · GLB</span>
                  </span>
                </button>
              ))}
            </section>
            {selected && (
              <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <div className="h-[420px] max-h-[60vh]">
                  <ThreeViewport modelType="mech" glbUrl={selected.url} className="h-full w-full" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-4">
                  <p className="max-w-full truncate text-sm text-slate-300">{selected.name}</p>
                  <a href={selected.url} download={selected.name} rel="noopener noreferrer"
                    className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                    <Download className="mr-2 inline h-4 w-4" /> Download GLB
                  </a>
                </div>
                <p className="px-4 pb-3 text-xs text-slate-500">Download links expire after one hour. Press Refresh links to renew.</p>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
