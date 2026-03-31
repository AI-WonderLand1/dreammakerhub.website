"use client";

import { useEffect } from "react";
import { ensurePlayCanvasBootstrapLoaded, shouldUseDirectPlayCanvasMode } from "@/lib/playcanvasBootstrap";

export function PlayCanvasBootstrapStartup() {
  useEffect(() => {
    if (!shouldUseDirectPlayCanvasMode()) {
      return;
    }

    void ensurePlayCanvasBootstrapLoaded().catch((error) => {
      console.error("PlayCanvas bootstrap preload failed", error);
    });
  }, []);

  return null;
}
