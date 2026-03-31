"use client";

import { useState, useEffect } from "react";
import { Extension, MarketplaceListResponse } from "./types";
import { purchaseExtension } from "./actions/purchaseExtension";
import { useAuth } from "@lib/supabase/auth-context";

type Props = {
  onInstall?: (extension: Extension) => void;
};

export function MarketplacePanel({ onInstall }: Props) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isSubscribed = false;
  const isEnterprise = false;

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/features/list");

      if (!res.ok) {
        throw new Error("Failed to load features");
      }

      const data = await res.json();
      
      // Combine custom and github features
      const allExtensions = [
        ...data.features.custom.map((f: any) => ({ ...f, source: 'custom' })),
        ...data.features.github.map((f: any) => ({ ...f, source: 'github' }))
      ];
      
      setExtensions(allExtensions);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (ext: any) => {
    if (ext.installed || installingId) return;

    if (!user?.id) {
      setError("You must be signed in to install features.");
      return;
    }

    setInstallingId(ext.id);
    setError(null);

    try {
      // Pass all 3 required arguments
      const result = await purchaseExtension(
        ext.id,
        user.id,
        ext.source // 'github' or 'custom'
      );

      if (!result.success) {
        // If payment required, redirect to checkout
        if (result.requiresPayment) {
          window.location.href = `/checkout?feature=${ext.id}`;
          return;
        }
        
        setError(result.message);
        return;
      }

      // Update UI to show installed
      setExtensions((prev) =>
        prev.map((e) => (e.id === ext.id ? { ...e, installed: true } : e))
      );

      // Show success message
      alert(result.message);

      // Notify parent component
      if (onInstall) {
        onInstall(ext);
      }
    } catch (err: any) {
      setError(err.message ?? "Install failed");
    } finally {
      setInstallingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-400">Loading features...</div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 border-l border-zinc-800 bg-zinc-950/60">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">
          Features Marketplace
        </h2>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      <div className="mb-2 text-xs text-zinc-400">
        Browsing is open to all. Installing requires an active subscription. Enterprise unlocks advanced/private extensions.
      </div>

      <div className="grid gap-3">
        {extensions.map((ext: any) => (
          <div
            key={ext.id}
            className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-100">
                {ext.name}
              </span>
              <span className="text-xs font-semibold text-yellow-400">
                Included with subscription
              </span>
            </div>

            <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
              {ext.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {ext.author && `by ${ext.author}`}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {ext.source === 'github' ? '🔓 Open Source' : '⭐ Premium'}
                </span>
              </div>

              <button
                onClick={() => handleInstall(ext)}
                disabled={ext.installed || installingId === ext.id || !isSubscribed}
                className="px-3 py-1 text-xs rounded transition-colors bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ext.installed
                  ? "✓ Installed"
                  : installingId === ext.id
                    ? "Installing..."
                    : isSubscribed
                      ? "Install (included)"
                      : "Upgrade to install"}
              </button>
            </div>
          </div>
        ))}

        {extensions.length === 0 && (
          <div className="text-xs text-zinc-500 text-center py-4">
            No features available yet.
          </div>
        )}
      </div>

      <button
        onClick={loadExtensions}
        className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
      >
        Refresh
      </button>
    </div>
  );
}
