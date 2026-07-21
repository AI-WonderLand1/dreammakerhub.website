"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PlayCanvasHostProps } from "@/components/PlayCanvasEditorHost";
import { ensurePlayCanvasBootstrapLoaded, resetPlayCanvasBootstrapLoader } from "@/lib/playcanvasBootstrap";
import { logger } from '@/lib/logger';

export function DirectPlayCanvasHost({ sceneId, onReady, onError, onStatus }: PlayCanvasHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<{ destroy?: () => void } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [mountAttempt, setMountAttempt] = useState(0);

  // Use refs for callbacks to avoid unstable dependencies
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onStatusRef = useRef(onStatus);
  
  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    onStatusRef.current = onStatus;
  }, [onReady, onError, onStatus]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAndMount() {
      onStatusRef.current?.("bootstrapping");
      setFailure(null);

      try {
        await ensurePlayCanvasBootstrapLoaded();
      } catch (error) {
        if (cancelled) return;
        const bootstrapError = error instanceof Error ? error : new Error("PlayCanvas bootstrap script failed to load");
        setFailure(`${bootstrapError.message}.`);
        onStatusRef.current?.("failed");
        onErrorRef.current?.(bootstrapError);
        return;
      }

      const container = containerRef.current;
      if (!container) {
        const containerError = new Error("PlayCanvas direct container not found");
        setFailure(containerError.message);
        onStatusRef.current?.("failed");
        onErrorRef.current?.(containerError);
        return;
      }

      const bootstrap = window.PlayCanvasEditorBootstrap;
      if (!bootstrap) {
        const bootstrapApiError = new Error("PlayCanvas bootstrap finished but API is unavailable");
        setFailure(bootstrapApiError.message);
        onStatusRef.current?.("failed");
        onErrorRef.current?.(bootstrapApiError);
        return;
      }

      onStatusRef.current?.("mounting");

      try {
        const cleanup = bootstrap.mount(container, { sceneId });
        
        // Store cleanup in ref so it's accessible in cleanup function
        cleanupRef.current = cleanup || null;
        
        if (cancelled) {
          // If cancelled during mount, clean up immediately
          cleanup?.destroy?.();
          cleanupRef.current = null;
          return;
        }
        
        // Check if mount returned a cleanup object with destroy method
        if (!cleanup || typeof cleanup.destroy !== "function") {
          logger.warn("PlayCanvas mount did not return a cleanup object with destroy method. Memory leaks may occur.");
        }
        
        onStatusRef.current?.("ready");
        onReadyRef.current?.();
      } catch (error) {
        if (cancelled) return;
        const mountError = error instanceof Error ? error : new Error("PlayCanvas direct mount failed");
        setFailure(mountError.message);
        onStatusRef.current?.("failed");
        onErrorRef.current?.(mountError);
      }
    }

    void bootstrapAndMount();

    return () => {
      cancelled = true;
      // Use ref to access cleanup, avoiding stale closure
      cleanupRef.current?.destroy?.();
      cleanupRef.current = null;
    };
  }, [mountAttempt, sceneId]); // Removed callback dependencies - using refs instead

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
