"use client";

import { DirectPlayCanvasHost } from "@/components/DirectPlayCanvasHost";
import { IframePlayCanvasHost } from "@/components/IframePlayCanvasHost";
import { getPlayCanvasMode, type PlayCanvasMode } from "@/lib/playcanvas";

export type PlayCanvasHostStatus = "bootstrapping" | "mounting" | "ready" | "failed";

export type PlayCanvasHostProps = {
  sceneId: string;
  onReady?: () => void;
  onError?: (error?: Error) => void;
  onStatus?: (status: PlayCanvasHostStatus) => void;
  mode?: PlayCanvasMode;
};

export default function PlayCanvasEditorHost({ mode, ...props }: PlayCanvasHostProps) {
  const resolvedMode = mode ?? getPlayCanvasMode();

  if (resolvedMode === "direct") {
    return <DirectPlayCanvasHost {...props} />;
  }

  return <IframePlayCanvasHost {...props} />;
}
