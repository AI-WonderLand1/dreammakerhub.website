"use client";

import { useEffect } from "react";
import { ensurePlayCanvasBootstrapLoaded, shouldUseDirectPlayCanvasMode } from "@/lib/playcanvasBootstrap";
import { logger } from '@/lib/logger';

export function PlayCanvasBootstrapStartup() {
  useEffect(() => {
    if (!shouldUseDirectPlayCanvasMode()) {
      return;
    }

    void ensurePlayCanvasBootstrapLoaded().catch((error) => {
      logger.error("PlayCanvas bootstrap preload failed", error);
    });
  }, []);

  return null;
}
