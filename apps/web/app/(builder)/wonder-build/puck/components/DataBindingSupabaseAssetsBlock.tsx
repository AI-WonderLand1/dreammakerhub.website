"use client";

import { useEffect, useMemo, useState } from "react";
import { logger } from '@/lib/logger';

export type DataBindingSupabaseAssetsBlockProps = {
  title: string;
  workspaceId: string;
  kind: "all" | "image" | "video" | "model" | "scene" | "misc";
  limit: number;
};

type AssetItem = {
  name: string;
  kind: string;
  path: string;
  size?: number;
  updatedAt?: string;
  signedUrl?: string | null;
};

export default function DataBindingSupabaseAssetsBlock({
  title,
  workspaceId,
  kind,
  limit,
}: DataBindingSupabaseAssetsBlockProps) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const qs = new URLSearchParams({
      workspaceId: workspaceId || "",
      limit: String(limit || 8),
    });
    if (kind && kind !== "all") qs.set("kind", kind);
    return qs.toString();
  }, [workspaceId, kind, limit]);

  useEffect(() => {
    if (!workspaceId) {
      setAssets([]);
      setError("Set a workspaceId to load assets.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/ai/assets?${query}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error?.message || "Failed to load assets");
        }
        if (!cancelled) setAssets(Array.isArray(data.assets) ? data.assets : []);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setAssets([]);
          setError(err?.message || "Failed to load assets");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, workspaceId]);

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-cyan-200">{title || "Supabase AI Assets"}</h4>
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">{assets.length} loaded</span>
      </div>

      {loading && <p className="text-xs text-zinc-400">Loading assets…</p>}
      {error && <p className="text-xs text-amber-300">{error}</p>}

      {!loading && !error && assets.length === 0 && (
        <p className="text-xs text-zinc-500">No assets found for this workspace.</p>
      )}

      <ul className="space-y-2">
        {assets.map((asset) => (
          <li key={asset.path} className="rounded-md border border-zinc-800/80 bg-zinc-950/60 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-zinc-200">{asset.name}</p>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">{asset.kind}</span>
            </div>
            {asset.signedUrl ? (
              <a
                href={asset.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[10px] text-cyan-300 underline-offset-2 hover:underline"
              >
                Open asset
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
