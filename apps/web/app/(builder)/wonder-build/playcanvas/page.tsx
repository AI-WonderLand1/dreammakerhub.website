"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";
import NpcPanel from "@/components/NpcPanel";
import PlayCanvasEditorHost from "@/components/PlayCanvasEditorHost";
import { createNpcProviderFromEnv } from "@/lib/ai/convaiNpcProvider";
import { buildPlayCanvasEditorUrl, getPlayCanvasMode } from "@/lib/playcanvas";

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const BRIDGE_READY_TIMEOUT_MS = 10_000;

function PlayCanvasInner() {
  const params = useSearchParams();
  const sceneId = params.get("sceneId")?.trim() ?? "";
  const [bridgeLoading, setBridgeLoading] = useState(Boolean(sceneId));
  const [bridgeFailed, setBridgeFailed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const npcProvider = useMemo(() => createNpcProviderFromEnv(), []);

  useEffect(() => {
    setBridgeLoading(Boolean(sceneId));
    setBridgeFailed(false);
  }, [sceneId]);

  const playCanvasMode = getPlayCanvasMode();
  const editorUrl = useMemo(() => buildPlayCanvasEditorUrl(sceneId), [sceneId]);

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

  return (
    <div className="space-y-4 text-white">
      <ToastStack toasts={toasts} />
      <PageHeader
        lead={<Breadcrumbs items={[{ href: "/wonder-build", label: "Wonder Build" }, { label: "WonderPlay" }]} />}
        title="WonderPlay Bridge"
        subtitle="Open and validate your PlayCanvas scene in a dedicated builder route with graceful loading and failure states."
        action={
          <a
            href={editorUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-black"
          >
            Open in PlayCanvas
          </a>
        }
      />

      <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">
        <span className="font-semibold">PlayCanvas mode:</span>
        <span className="rounded-full bg-black/40 px-2 py-0.5 uppercase tracking-wide">{playCanvasMode}</span>
        {playCanvasMode === "direct" ? <span className="text-cyan-300">NEXT_PUBLIC_PLAYCANVAS_MODE=direct</span> : null}
      </div>

      {!sceneId ? (
        <EmptyState
          title="Add a PlayCanvas scene ID"
          description="Use ?sceneId=<your-scene-id> on this URL to load WonderPlay in the embedded bridge."
          cta={
            <a
              href="https://playcanvas.com/editor"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/90"
            >
              Find Scene ID
            </a>
          }
        />
      ) : (
        <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          {bridgeFailed ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-6 py-8 text-center">
                <h3 className="text-lg font-bold text-white">Embed blocked — continue in PlayCanvas</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
                  The in-app WonderPlay embed did not report readiness in time. Open the editor in a new tab to continue building.
                </p>
                <div className="mt-5">
                  <a
                    href={editorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-black"
                  >
                    Open PlayCanvas in New Tab
                  </a>
                </div>
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
        <Link href="/dashboard/editor-playcanvas" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          Open Dashboard Bridge
        </Link>
        <Link href="/wonder-build/playcanvas" className="rounded-md border border-white/20 px-3 py-2 text-white/85 hover:bg-white/10">
          Open PlayCanvas Studio
        </Link>
      </div>

      <div>
        <Link href="/wonder-build/puck" className="text-sm text-white/70 hover:text-white">
          ← Back to Puck Layout Studio
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
