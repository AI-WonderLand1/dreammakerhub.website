"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutTemplate, RefreshCw } from "lucide-react";

type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  glbUrl?: string;
  nodes?: unknown[];
  environment?: { skybox?: string; ambient?: number[] };
};

export default function StudioTemplatesPanel() {
  const [templates, setTemplates] = useState<SceneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch("/api/scenes/templates", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Templates could not load (HTTP ${response.status}).`);
        const payload: unknown = await response.json();
        const raw = payload && typeof payload === "object" && "templates" in payload
          ? (payload as { templates?: unknown }).templates
          : null;
        if (!Array.isArray(raw)) throw new Error("Template response was invalid.");
        const scenes = raw.filter((item): item is SceneTemplate =>
          !!item && typeof item === "object" &&
          typeof item.id === "string" && typeof item.name === "string");
        if (!controller.signal.aborted) setTemplates(scenes);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Templates could not load.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  return (
    <section className="h-full min-h-0 overflow-y-auto bg-[#0b101b] p-5 text-slate-100" aria-label="WonderPlay scene templates">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><LayoutTemplate size={19} /> Scene Templates</h2>
            <p className="mt-1 text-xs text-slate-400">Choose an existing template or start a new world in the World & Game tab.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setRevision((n) => n + 1)} disabled={loading}
              className="rounded border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw size={13} className={loading ? "inline animate-spin" : "inline"} /> Refresh
            </button>
            <Link href="/dashboard/3dhub?tab=world&tool=game" className="rounded bg-blue-600 px-3 py-2 text-xs font-bold hover:bg-blue-500">Start new world</Link>
          </div>
        </div>
        {loading ? (
          <p role="status" className="rounded border border-slate-800 p-5 text-sm text-slate-400">Loading your available templates…</p>
        ) : error ? (
          <p role="alert" className="rounded border border-red-900/50 p-5 text-sm text-red-300">{error}</p>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-9 text-center">
            <p className="font-semibold">No saved scene templates available yet.</p>
            <p className="mt-2 text-sm text-slate-400">The World & Game tab includes starter world presets. Nothing has been fabricated here.</p>
            <Link href="/dashboard/3dhub?tab=world&tool=game" className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-semibold">Open World Builder</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((item) => (
              <Link key={item.id} href={`/wonder-build/playcanvas/editor/${encodeURIComponent(item.id)}`}
                className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 transition hover:border-blue-500">
                <div className="flex aspect-video items-center justify-center bg-slate-950 text-slate-500"><LayoutTemplate size={35} aria-hidden="true" /></div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.description || "Saved PlayCanvas scene template"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        {templates.length > 0 && <p className="mt-4 text-xs text-slate-500">Existing saved scene templates open in the compatible legacy editor until their data format is migrated.</p>}
      </div>
    </section>
  );
}
