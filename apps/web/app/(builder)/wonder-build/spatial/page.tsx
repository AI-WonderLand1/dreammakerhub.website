"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";

const SPATIAL_CLOUD_URL = process.env.NEXT_PUBLIC_SPATIAL_CLOUD_URL || "https://spatial.ai-wonderland.app";

export default function SpatialDesignerPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"cloud" | "cli" | "embed">("cloud");
  const [embedError, setEmbedError] = useState(false);

  const spatialUrl = user
    ? `${SPATIAL_CLOUD_URL}?token=${encodeURIComponent(user.id)}`
    : SPATIAL_CLOUD_URL;

  useEffect(() => {
    if (!loading && !user) {
      setMode("cli");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (embedError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
        <span className="text-6xl">🌌</span>
        <h1 className="text-2xl font-bold text-white">Spatial Designer</h1>
        <p className="max-w-md text-sm text-white/60">
          Cloud service unavailable. Use CLI mode.
        </p>
        <Link href="/wonder-build" className="rounded-lg border border-white/20 px-6 py-2 text-sm text-white/70 hover:bg-white/10">
          ← Back
        </Link>
      </div>
    );
  }

  if (mode === "cli" || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
        <span className="text-6xl">🌌</span>
        <h1 className="text-2xl font-bold text-white">Spatial Designer CLI</h1>
        <p className="max-w-md text-sm text-white/60">
          Install the Spatial Designer CLI for local 3D development.
        </p>
        <div className="bg-black/40 rounded-lg p-4 max-w-md">
          <code className="text-cyan-400 text-sm">npm install -g @wonderspace/spatial-cli</code>
        </div>
        <Link href="/wonder-build" className="mt-4 text-xs text-white/40 hover:text-white">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      <header className="flex items-center gap-3 border-b border-white/10 bg-black/60 px-4 py-2">
        <Link href="/wonder-build" className="rounded px-2 py-1 text-xs text-white/50 hover:text-white">
          ← Back
        </Link>
        <span className="text-sm font-semibold text-cyan-400">🌌 Spatial Designer</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMode("cloud")}
            className={`rounded-l-lg px-3 py-1 text-xs ${
              mode === "cloud" ? "bg-cyan-600 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Cloud
          </button>
          <button
            onClick={() => setMode("cli")}
            className={`rounded-r-lg px-3 py-1 text-xs ${
              mode === "cli" ? "bg-cyan-600 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            CLI
          </button>
        </div>
      </header>

      {mode === "cloud" && (
        <iframe
          src={spatialUrl}
          className="h-full w-full"
          allow="camera;microphone;clipboard-read;clipboard-write;web-share"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onError={() => setEmbedError(true)}
        />
      )}

      {mode === "cli" && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <span className="text-6xl">🌌</span>
            <p className="mt-4 text-sm text-white/50">
              Run locally: <code className="text-cyan-400">spatial-cli</code>
            </p>
            <p className="text-xs text-white/30 mt-2">
              npm install -g @wonderspace/spatial-cli
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
