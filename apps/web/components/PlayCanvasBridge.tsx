"use client";

import PlayCanvasEditorHost, { type PlayCanvasHostProps } from "@/components/PlayCanvasEditorHost";

type LegacyPlayCanvasBridgeProps = Omit<PlayCanvasHostProps, "onReady"> & {
  onLoad?: () => void;
};

export default function PlayCanvasBridge({ onLoad, onReady, ...props }: LegacyPlayCanvasBridgeProps & { onReady?: () => void }) {
  return <PlayCanvasEditorHost {...props} onReady={onReady ?? onLoad} />;
}
