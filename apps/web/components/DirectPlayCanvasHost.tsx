"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayCanvasHostProps } from "@/components/PlayCanvasEditorHost";
import { ensurePlayCanvasBootstrapLoaded, resetPlayCanvasBootstrapLoader } from "@/lib/playcanvasBootstrap";

export function DirectPlayCanvasHost({ sceneId, onReady, onError, onStatus }: PlayCanvasHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [mountAttempt, setMountAttempt] = useState(0);

  useEffect(() => {
    let cleanup: { destroy?: () => void } | void;
    let cancelled = false;

    async function bootstrapAndMount() {
      onStatus?.("bootstrapping");
      setFailure(null);

      try {
        await ensurePlayCanvasBootstrapLoaded();
      } catch (error) {
        if (cancelled) return;
        const bootstrapError = error instanceof Error ? error : new Error("PlayCanvas bootstrap script failed to load");
        setFailure(`${bootstrapError.message}.`);
        onStatus?.("failed");
        onError?.(bootstrapError);
        return;
      }

      const container = containerRef.current;
      if (!container) {
        const containerError = new Error("PlayCanvas direct container not found");
        setFailure(containerError.message);
        onStatus?.("failed");
        onError?.(containerError);
        return;
      }

      const bootstrap = window.PlayCanvasEditorBootstrap;
      if (!bootstrap) {
        const bootstrapApiError = new Error("PlayCanvas bootstrap finished but API is unavailable");
        setFailure(bootstrapApiError.message);
        onStatus?.("failed");
        onError?.(bootstrapApiError);
        return;
      }

      onStatus?.("mounting");

      try {
        cleanup = bootstrap.mount(container, { sceneId });
        if (cancelled) {
          cleanup?.destroy?.();
          return;
        }
        onStatus?.("ready");
        onReady?.();
      } catch (error) {
        if (cancelled) return;
        const mountError = error instanceof Error ? error : new Error("PlayCanvas direct mount failed");
        setFailure(mountError.message);
        onStatus?.("failed");
        onError?.(mountError);
      }
    }

    void bootstrapAndMount();

    return () => {
      cancelled = true;
      cleanup?.destroy?.();
    };
  }, [mountAttempt, onError, onReady, onStatus, sceneId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" data-testid="playcanvas-direct-host" />
      {failure ? (
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-xl border border-red-400/50 bg-red-900/80 p-4 text-center text-white">
          <p className="text-sm font-semibold">PlayCanvas direct bootstrap failed</p>
          <p className="mt-2 max-w-xl text-xs text-red-100">{failure}</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25"
            onClick={() => {
              resetPlayCanvasBootstrapLoader();
              setMountAttempt((current) => current + 1);
            }}
          >
            Retry bootstrap
          </button>
        </div>
      ) : null}
    </div>
  );
}
