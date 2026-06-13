"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";

const SPATIAL_EXTERNAL_URL = "https://spatial.dreammakerhub.website";

export default function SpatialDesignerPage() {
  const { user, session } = useAuth();
  const [mode, setMode] = useState<"embed" | "tab">("embed");
  const [embedError, setEmbedError] = useState(false);

  const spatialUrl = session?.access_token
    ? `${SPATIAL_EXTERNAL_URL}?token=${session.access_token}&userId=${user?.id}`
    : SPATIAL_EXTERNAL_URL;

  if (embedError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
        <span className="text-6xl">🌌</span>
        <h1 className="text-2xl font-bold text-white">Spatial Designer</h1>
        <p className="max-w-md text-sm text-white/60">
          The embedded view was blocked by your browser. Open it in a new tab to continue.
        </p>
        <div className="flex gap-3">
          <a
            href={spatialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Open in New Tab
          </a>
          <button
            onClick={() => setEmbedError(false)}
            className="rounded-lg border border-white/20 px-6 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Retry Embed
          </button>
        </div>
        <Link href="/wonder-build" className="mt-4 text-xs text-white/40 hover:text-white">
          ← Back to Wonder Build
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      <header className="flex items-center gap-3 border-b border-white/10 bg-black/60 px-4 py-2">
        <Link
          href="/wonder-build"
          className="rounded px-2 py-1 text-xs text-white/50 hover:text-white"
        >
          ← Back
        </Link>
        <span className="text-sm font-semibold text-cyan-400">🌌 Spatial Designer</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10">
            <button
              onClick={() => setMode("embed")}
              className={`rounded-l-lg px-3 py-1 text-xs ${
                mode === "embed" ? "bg-cyan-600 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Embed
            </button>
            <button
              onClick={() => setMode("tab")}
              className={`rounded-r-lg px-3 py-1 text-xs ${
                mode === "tab" ? "bg-cyan-600 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              New Tab
            </button>
          </div>

          {mode === "tab" && (
            <a
              href={spatialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-cyan-600 px-4 py-1 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              Open Spatial Designer
            </a>
          )}
        </div>
      </header>

      {mode === "embed" && (
        <div className="relative flex-1">
          <iframe
            src={spatialUrl}
            className="h-full w-full"
            allow="camera;microphone;clipboard-read;clipboard-write;web-share"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={() => setEmbedError(true)}
          />
        </div>
      )}

      {mode === "tab" && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <span className="text-6xl">🌌</span>
            <p className="mt-4 text-sm text-white/50">
              Spatial Designer opened in a new tab.
            </p>
            <p className="text-xs text-white/30">
              Close this tab or go back to Wonder Build when done.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
