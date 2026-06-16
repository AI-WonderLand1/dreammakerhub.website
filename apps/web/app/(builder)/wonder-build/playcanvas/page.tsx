"use client";

import Link from "next/link";
import Image from "next/image";
<<<<<<< HEAD
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
=======
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
import { useSearchParams } from "next/navigation";

import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";
import SafeNpcPanel from "@/components/SafeNpcPanel";
import PlayCanvasEditorHost from "@/components/PlayCanvasEditorHost";
import { createNpcProviderFromEnv } from "@/lib/ai/convaiNpcProvider";
import { buildPlayCanvasEditorUrl, getPlayCanvasMode } from "@/lib/playcanvas";
import { useAutoSave, cleanSceneData } from "@/lib/scene/auto-save";
<<<<<<< HEAD
=======
import { saveSceneToSupabase, listUserScenes } from "@/lib/scene/supabase-store";
import { searchExternalAssets, downloadAssetToStorage, type ExternalAsset } from "@/lib/ai/assetLibrary";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
import { useAuth } from "@/lib/supabase/auth-context";

type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
};
<<<<<<< HEAD
=======

type SceneVersion = {
  id: string;
  version: number;
  created_at: string;
};
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const BRIDGE_READY_TIMEOUT_MS = 30_000;

function PlayCanvasInner() {
<<<<<<< HEAD
  const params = useSearchParams();
  const sceneId = params.get("sceneId")?.trim() ?? "";
=======
  const searchParams = useSearchParams();
  const sceneId = searchParams?.get("sceneId")?.trim() ?? "";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  const { user } = useAuth();
  const [bridgeLoading, setBridgeLoading] = useState(Boolean(sceneId));
  const [bridgeFailed, setBridgeFailed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [templates, setTemplates] = useState<SceneTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(!sceneId);
  const [sceneData, setSceneData] = useState<any>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const npcProvider = useMemo(() => createNpcProviderFromEnv(), []);

<<<<<<< HEAD
=======
  const [assets, setAssets] = useState<ExternalAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetSearching, setAssetSearching] = useState(false);
  const [importingAsset, setImportingAsset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<SceneVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [showAssetLib, setShowAssetLib] = useState(false);
  const editorRef = useRef<any>(null);

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  const { saveNow } = useAutoSave(sceneId, sceneData, user?.id, {
    intervalMs: 30000,
    enabled: !!sceneId && !!sceneData,
  });

  useEffect(() => {
    setBridgeLoading(Boolean(sceneId));
    setBridgeFailed(false);
  }, [sceneId]);

  useEffect(() => {
    if (!sceneId) {
      setLoadingTemplates(true);
      fetch("/api/scenes/templates")
        .then(res => res.json())
        .then(data => {
          setTemplates(data.templates || []);
          setLoadingTemplates(false);
        })
        .catch(() => {
          setLoadingTemplates(false);
        });
    }
  }, [sceneId]);
<<<<<<< HEAD
=======

  useEffect(() => {
    if (!sceneId) return;
    fetch(`/api/scenes/${sceneId}/versions`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setVersions(data.versions || []);
        setCurrentVersion(data.currentVersion || 1);
      })
      .catch(() => {});
  }, [sceneId]);
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    if (!sceneId || !bridgeLoading || bridgeFailed) return;

    const timeoutId = window.setTimeout(() => {
      setBridgeLoading(false);
      setBridgeFailed(true);
      pushToast("PlayCanvas editor did not become ready. Try again or use a different browser.", "error");
    }, BRIDGE_READY_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [bridgeFailed, bridgeLoading, pushToast, sceneId]);

  useEffect(() => {
    if (!sceneId || isCleaningUp) return;

    async function loadAndCleanScene() {
      try {
        const res = await fetch(`/api/scenes/${sceneId}`);
        if (res.ok) {
          const data = await res.json();
          const cleaned = cleanSceneData(data);
          setSceneData(cleaned);
          pushToast("Scene loaded and cleaned", "success");
        }
      } catch (err) {
        console.error("Failed to load scene:", err);
      }
    }

    loadAndCleanScene();
  }, [sceneId, isCleaningUp, pushToast]);

<<<<<<< HEAD
=======
  const handleSave = useCallback(async () => {
    if (!sceneId || !user || !sceneData) return;
    setSaving(true);
    try {
      const newVersion = currentVersion + 1;
      await saveSceneToSupabase(`${sceneId}_v${newVersion}`, { ...sceneData, name: `v${newVersion}` }, user.id);
      setCurrentVersion(newVersion);
      setVersions(prev => [...prev, { id: `${sceneId}_v${newVersion}`, version: newVersion, created_at: new Date().toISOString() }]);
      pushToast(`Saved as version ${newVersion}`, "success");
    } catch {
      pushToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, [sceneId, user, sceneData, currentVersion, pushToast]);

  const handleLoadVersion = useCallback(async (versionId: string, version: number) => {
    pushToast(`Loading version ${version}...`, "success");
    try {
      const res = await fetch(`/api/scenes/${versionId}`);
      if (res.ok) {
        const data = await res.json();
        const cleaned = cleanSceneData(data);
        setSceneData(cleaned);
        setCurrentVersion(version);
        setShowVersions(false);
      }
    } catch {
      pushToast("Failed to load version", "error");
    }
  }, [pushToast]);

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  const handlePublish = useCallback(async () => {
    if (!sceneId) return;
    pushToast("Publishing...", "success");
    await saveNow();
    pushToast("Published!", "success");
    window.location.href = `/play/${sceneId}`;
  }, [sceneId, saveNow, pushToast]);

<<<<<<< HEAD
=======
  const handleSearchAssets = useCallback(async () => {
    setAssetSearching(true);
    try {
      const results = await searchExternalAssets({ query: assetSearch || "3d model", limit: 12 });
      setAssets(results);
    } finally {
      setAssetSearching(false);
    }
  }, [assetSearch]);

  const handleImportAsset = useCallback(async (asset: ExternalAsset) => {
    if (!user) return;
    setImportingAsset(asset.id);
    try {
      const result = await downloadAssetToStorage(asset, user.id);
      if (result.success && result.localUrl) {
        pushToast(`Imported ${asset.name}`, "success");
        if (editorRef.current && typeof editorRef.current.addModel === "function") {
          editorRef.current.addModel(result.localUrl);
        }
      }
    } catch {
      pushToast(`Failed to import ${asset.name}`, "error");
    } finally {
      setImportingAsset(null);
    }
  }, [user, pushToast]);

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  return (
    <div className="space-y-4 text-white">
      <ToastStack toasts={toasts} />

      {!sceneId && (
        <div className="mb-4">
          <Link href="/wonder-build/playcanvas" className="text-sm text-white/70 hover:text-white">
            ← Back to Gallery
          </Link>
        </div>
      )}
<<<<<<< HEAD
=======

      {sceneId && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/50">Version:</span>
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="rounded bg-white/10 px-2 py-1 text-xs font-mono text-white/80 hover:bg-white/20"
            >
              v{currentVersion}
            </button>
            {showVersions && (
              <div className="absolute top-full left-0 z-30 mt-1 w-48 rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl">
                <div className="max-h-48 overflow-y-auto p-2">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleLoadVersion(v.id, v.version)}
                      className={`w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10 ${
                        v.version === currentVersion ? "text-cyan-300" : "text-white/70"
                      }`}
                    >
                      v{v.version} — {new Date(v.created_at).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !user}
            className="rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Version"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAssetLib(!showAssetLib)}
              className="rounded bg-violet-600/50 px-3 py-1 text-xs text-white/80 hover:bg-violet-600"
            >
              📦 Assets
            </button>
          </div>
        </div>
      )}

      {showAssetLib && (
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchAssets(); }}
              placeholder="Search 3D assets..."
              className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30"
            />
            <button
              onClick={handleSearchAssets}
              disabled={assetSearching}
              className="rounded bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500 disabled:opacity-40"
            >
              {assetSearching ? "..." : "Search"}
            </button>
          </div>
          {assets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleImportAsset(asset)}
                  disabled={importingAsset === asset.id}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-2 hover:border-violet-500/50 disabled:opacity-40"
                >
                  {asset.thumbnailUrl ? (
                    <Image src={asset.thumbnailUrl} alt={asset.name} width={40} height={40} className="rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-lg">🎨</div>
                  )}
                  <span className="max-w-20 truncate text-[10px] text-white/60">{asset.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

      {!sceneId ? (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Choose a Scene Template</h2>
<<<<<<< HEAD
            <p className="mt-2 text-white/60">Select a template to launch the WebGL editor</p>
=======
            <p className="mt-2 text-white/60">Select a template to launch the PlayCanvas editor</p>
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
          </div>

          {loadingTemplates ? (
            <SkeletonGrid cards={6} />
          ) : templates.length === 0 ? (
            <EmptyState
              title="No templates available"
              description="Create a new scene from scratch"
              cta={
                <Link
                  href="/wonder-build/playcanvas?sceneId=blank_canvas"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                >
                  Start Blank
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/wonder-build/playcanvas?sceneId=${template.id}`}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-purple-500/50 hover:bg-white/10"
                >
                  {template.thumbnail ? (
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      width={300}
                      height={200}
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-purple-900/30 to-blue-900/30" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-purple-300">{template.name}</h3>
                    <p className="mt-1 text-xs text-white/60 line-clamp-2">{template.description}</p>
                    <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                      {template.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          {bridgeFailed ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-6 py-8 text-center">
                <h3 className="text-lg font-bold text-white">Embed blocked — continue in new tab</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
                  The PlayCanvas editor did not report readiness in 30 seconds. This may be due to browser sandbox restrictions.
                </p>
<<<<<<< HEAD
                <div className="mt-5"></div>
=======
                <div className="mt-5">
                  <button
                    onClick={() => { setBridgeLoading(true); setBridgeFailed(false); }}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                  >
                    Retry
                  </button>
                </div>
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
              </div>
            </div>
          ) : (
            <>
              {bridgeLoading ? (
                <div className="absolute inset-0 p-4">
                  <SkeletonGrid cards={2} />
                </div>
              ) : null}

              <PlayCanvasEditorHost
                sceneId={sceneId}
                onReady={() => {
                  setBridgeLoading(false);
                  setBridgeFailed(false);
                  pushToast("PlayCanvas editor connected.", "success");
                }}
                onError={() => {
                  setBridgeLoading(false);
                  setBridgeFailed(true);
                  pushToast("Could not embed PlayCanvas. Retrying...", "error");
                }}
              />
            </>
          )}
        </div>
      )}

      <SafeNpcPanel
        provider={npcProvider}
        onProviderError={(message) => {
          pushToast(message, "error");
        }}
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/dashboard/projects" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          ← Dashboard
        </Link>
        <Link href="/library" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          📚 Library
        </Link>
        <Link href="/game-builder/create" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          🎨 Create New
        </Link>
<<<<<<< HEAD
        <button 
=======
        <button
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
          onClick={handlePublish}
          disabled={!sceneId}
          className="rounded-md border border-green-500/50 bg-green-600/20 px-3 py-2 text-green-400 hover:bg-green-600/30 disabled:opacity-50"
        >
          🚀 Publish
        </button>
        <Link href="/dashboard/editor-playcanvas" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          Dashboard Bridge
        </Link>
      </div>

      <div>
<<<<<<< HEAD
        <Link href="/wonder-build/puck" className="text-sm text-white/70 hover:text-white">
          ← Back to Wonderbuild UI
=======
        <Link href="/wonder-build" className="text-sm text-white/70 hover:text-white">
          ← Back to Wonder Build
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
        </Link>
      </div>
    </div>
  );
}

export default function WonderBuildPlayCanvasPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white/50 text-sm">Loading editor…</div>}>
      <PlayCanvasInner />
    </Suspense>
  );
}
