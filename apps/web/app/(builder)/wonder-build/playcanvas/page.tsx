"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";
import SafeNpcPanel from "@/components/SafeNpcPanel";
import PlayCanvasEditorHost from "@/components/PlayCanvasEditorHost";
import { createNpcProviderFromEnv } from "@/lib/ai/convaiNpcProvider";
import { buildPlayCanvasEditorUrl, getPlayCanvasMode } from "@/lib/playcanvas";
import { useAutoSave, cleanSceneData } from "@/lib/scene/auto-save";
import { useAuth } from "@/lib/supabase/auth-context";

type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
};

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const BRIDGE_READY_TIMEOUT_MS = 10_000;

function PlayCanvasInner() {
  const params = useSearchParams();
  const sceneId = params.get("sceneId")?.trim() ?? "";
  const { user } = useAuth();
  const [bridgeLoading, setBridgeLoading] = useState(Boolean(sceneId));
  const [bridgeFailed, setBridgeFailed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [templates, setTemplates] = useState<SceneTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(!sceneId);
  const [sceneData, setSceneData] = useState<any>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const npcProvider = useMemo(() => createNpcProviderFromEnv(), []);

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

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    if (!sceneId || !bridgeLoading || bridgeFailed) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBridgeLoading(false);
      setBridgeFailed(true);
      pushToast("WonderPlay embed did not become ready. Continue in a new tab.", "error");
    }, BRIDGE_READY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
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

  const handlePublish = useCallback(async () => {
    if (!sceneId) return;
    pushToast("Publishing...", "success");
    await saveNow();
    pushToast("Published!", "success");
    window.location.href = `/play/${sceneId}`;
  }, [sceneId, saveNow, pushToast]);

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

      {!sceneId ? (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Choose a Scene Template</h2>
            <p className="mt-2 text-white/60">Select a template to launch the WebGL editor</p>
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
                <h3 className="text-lg font-bold text-white">Embed blocked — continue in PlayCanvas</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
                  The in-app WonderPlay embed did not report readiness in time. Open the editor in a new tab to continue building.
                </p>
                <div className="mt-5"></div>
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
                  pushToast("WonderPlay connected.", "success");
                }}
                onError={() => {
                  setBridgeLoading(false);
                  setBridgeFailed(true);
                  pushToast("Could not embed WonderPlay. Continue in a new tab.", "error");
                }}
              />
            </>
          )}
        </div>
      )}

      <NpcPanel
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
        <button 
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
        <Link href="/wonder-build/puck" className="text-sm text-white/70 hover:text-white">
          ← Back to Wonderbuild UI
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
