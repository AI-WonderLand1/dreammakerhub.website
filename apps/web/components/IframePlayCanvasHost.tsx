"use client";

import { useEffect, useRef } from "react";
import { buildPlayCanvasEditorUrl, getPlayCanvasIframeTargetOrigin } from "@/lib/playcanvas";
import { getBridgeMessageFromEvent, sendBridgeMessage } from "@/lib/playcanvasBridgeProtocol";
import type { PlayCanvasHostProps } from "@/components/PlayCanvasEditorHost";

export function IframePlayCanvasHost({ sceneId, onReady, onError, onStatus }: PlayCanvasHostProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const targetOrigin = getPlayCanvasIframeTargetOrigin();

  useEffect(() => {
    onStatus?.("mounting");

    const handleEditorMessage = (event: MessageEvent) => {
      const message = getBridgeMessageFromEvent(event, iframeRef.current?.contentWindow);
      if (!message) return;

      if (message.type === "bridge:error") {
        onStatus?.("failed");
        onError?.();
        return;
      }

      if (message.type === "bridge:ready") {
        onStatus?.("ready");
        onReady?.();
      }
    };

    window.addEventListener("message", handleEditorMessage);
    return () => window.removeEventListener("message", handleEditorMessage);
  }, [onError, onReady, onStatus]);

  useEffect(() => {
    sendBridgeMessage(iframeRef.current?.contentWindow, targetOrigin, {
      type: "scene:update",
      payload: { sceneId, status: "idle" },
    });
  }, [sceneId, targetOrigin]);

  return (
    <iframe
      ref={iframeRef}
      src={buildPlayCanvasEditorUrl(sceneId)}
      className="h-full w-full border-0"
      referrerPolicy="strict-origin-when-cross-origin"
      onError={() => {
        onStatus?.("failed");
        onError?.();
      }}
    />
  );
}
