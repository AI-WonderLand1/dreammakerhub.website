"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NpcLiveStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export type NpcVoiceEvent = {
  audio: string; // base64
  npcId: string;
};

export type NpcVisemeEvent = {
  visemes: { jawOpen: number; mouthFunnel: number; mouthPucker: number };
  npcId: string;
};

export type NpcDialogueEvent = {
  dialogue: { text: string; speaker?: string; emotion?: string };
  npcId: string;
};

export type NpcLiveEvent =
  | { type: "meta"; data: { npcId: string; userId: string; engineUrl: string } }
  | { type: "status"; data: { status: string } }
  | { type: "voice"; data: NpcVoiceEvent }
  | { type: "viseme"; data: NpcVisemeEvent }
  | { type: "dialogue"; data: NpcDialogueEvent }
  | { type: "message"; data: { data: unknown; npcId: string } }
  | { type: "error"; data: { message: string } };

export type NpcRealtimeHandlers = {
  onVoice?: (event: NpcVoiceEvent) => void;
  onViseme?: (event: NpcVisemeEvent) => void;
  onDialogue?: (event: NpcDialogueEvent) => void;
  onMessage?: (data: unknown) => void;
  onError?: (message: string) => void;
};

/**
 * Client-side real-time NPC bridge.
 *
 * Opens an EventSource to the edge function `/api/npc/live?npcId={npcId}` which relays
 * the npc-ai-sim engine WebSocket stream (voice, visemes, dialogue) privately for the
 * authenticated user. Events are forwarded to the supplied handlers so the dashboard can
 * render live status or push them into the PlayCanvas WebGL runtime.
 */
export function useNpcRealtime(
  npcId: string | null,
  handlers: NpcRealtimeHandlers = {},
) {
  const [status, setStatus] = useState<NpcLiveStatus>("idle");
  const [lastEvent, setLastEvent] = useState<NpcLiveEvent | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!npcId) {
      setStatus("idle");
      return;
    }

    let cancelled = false;

    const connect = () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }

      setStatus("connecting");
      const source = new EventSource(`/api/npc/live?npcId=${encodeURIComponent(npcId)}`);
      sourceRef.current = source;

      source.addEventListener("meta", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        setLastEvent({ type: "meta", data });
      });

      source.addEventListener("status", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        setStatus(data.status === "connected" ? "connected" : "disconnected");
        setLastEvent({ type: "status", data });
      });

      source.addEventListener("voice", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as NpcVoiceEvent;
        setLastEvent({ type: "voice", data });
        handlersRef.current.onVoice?.(data);
      });

      source.addEventListener("viseme", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as NpcVisemeEvent;
        setLastEvent({ type: "viseme", data });
        handlersRef.current.onViseme?.(data);
      });

      source.addEventListener("dialogue", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as NpcDialogueEvent;
        setLastEvent({ type: "dialogue", data });
        handlersRef.current.onDialogue?.(data);
      });

      source.addEventListener("message", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { data: unknown; npcId: string };
        setLastEvent({ type: "message", data });
        handlersRef.current.onMessage?.(data.data);
      });

      source.addEventListener("error", (event) => {
        if (cancelled) return;
        const raw = (event as MessageEvent).data;
        let message = "NPC live stream error";
        try {
          message = raw ? JSON.parse(raw).message : "EventSource connection failed";
        } catch {
          // ignore
        }
        setStatus("error");
        handlersRef.current.onError?.(message);
      });

      source.onerror = () => {
        if (cancelled) return;
        setStatus("disconnected");
      };
    };

    connect();

    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [npcId]);

  const disconnect = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setStatus("idle");
  }, []);

  return { status, lastEvent, disconnect };
}

/**
 * Forward an NPC live event into a PlayCanvas WebGL runtime.
 * `targetWindow` should be the iframe contentWindow hosting the PlayCanvas engine.
 */
export function forwardToPlayCanvas(
  event: NpcLiveEvent,
  targetWindow: Window | null | undefined,
) {
  if (!targetWindow) return false;
  targetWindow.postMessage(
    {
      type: "NPC_LIVE_EVENT",
      npcEvent: event,
      ts: Date.now(),
    },
    "*",
  );
  return true;
}
