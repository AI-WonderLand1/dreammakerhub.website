"use client";

import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";
import { IsolatedPlayCanvas } from "@/components/playcanvas-isolation";
import { getCurrentUserSession } from "@/components/playcanvas-isolation/utils/auth";
import { createNpcProviderFromEnv } from "@/lib/ai/convaiNpcProvider";
import NpcPanel from "@/components/NpcPanel";

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ScenePageInner() {
  const params = useParams();
  const sceneId = params.sceneId as string || "default-scene";
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const npcProvider = useMemo(() => createNpcProviderFromEnv(), []);
  const npcEnabled = process.env.NEXT_PUBLIC_ENABLE_CONVAI_NPC === "true";

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getCurrentUserSession();
        if (session?.userId) {
          setUserId(session.userId);
        } else {
          setUserId(`guest-${Date.now()}`);
        }
      } catch {
        setUserId(`guest-${Date.now()}`);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (!editorError) return;
    const timeoutId = window.setTimeout(() => {
      pushToast("Editor did not load. Click retry to try again.", "error");
    }, 15000);
    return () => window.clearTimeout(timeoutId);
  }, [editorError]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const handleReady = useCallback(() => {
    pushToast("Your private editor is ready.", "success");
  }, [pushToast]);

  const handleError = useCallback((error: Error) => {
    const msg = error.message || "Failed to load editor";
    if (!msg.includes("WebContainer") && !msg.includes("SharedArrayBuffer")) {
      setEditorError(msg);
    }
    pushToast(msg, "error");
  }, [pushToast]);

  const handleStatusChange = useCallback((status: string) => {
    console.log("[Editor Status]", status);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Preparing your private environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastStack toasts={toasts} />

      {editorError && (
        <div className="m-4 p-4 rounded-xl border border-red-400/40 bg-red-500/10">
          <h3 className="text-lg font-bold text-white">Editor Failed to Load</h3>
          <p className="mt-2 text-sm text-white/70">{editorError}</p>
          <button
            onClick={() => setEditorError(null)}
            className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Retry
          </button>
        </div>
      )}

      <div className="m-4 overflow-hidden rounded-2xl border border-white/10">
        <IsolatedPlayCanvas
          userId={userId}
          sceneId={sceneId}
          onReady={handleReady}
          onError={handleError}
          onStatusChange={handleStatusChange}
          className="h-[600px]"
        />
      </div>

      {npcEnabled && (
        <div className="m-4">
          <NpcPanel
            provider={npcProvider}
            onProviderError={(message) => pushToast(message, "error")}
          />
        </div>
      )}
    </div>
  );
}

export default function ScenePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-white/50 text-sm">
        Loading scene...
      </div>
    }>
      <ScenePageInner />
    </Suspense>
  );
}