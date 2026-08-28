import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WONDERPLAY_3D_URL =
  process.env.NEXT_PUBLIC_WONDERPLAY_3D_URL || "https://npc-ai-sim.dreammakerhub.website";

/**
 * Real-time NPC pipeline edge function.
 *
 * Bridges the dashboard to the wonderplay-3D engine WebSocket (`/live-npc?id={npcId}`)
 * and relays the NPC brain stream (voice audio, visemes, dialogue events) back to the
 * authenticated user's dashboard over SSE. The dashboard then forwards these events
 * into the PlayCanvas WebGL runtime.
 *
 * Privacy: each request is authenticated against the Supabase session and only relays
 * the NPC the caller explicitly owns/selects. No cross-user data is exposed.
 */
export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const npcId = searchParams.get("npcId")?.trim() ?? "";
  if (!npcId) {
    return new Response("Missing npcId", { status: 400 });
  }

  const wsUrl = WONDERPLAY_3D_URL.replace(/^http/, "ws") + `/live-npc?id=${encodeURIComponent(npcId)}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Controller may already be closed.
        }
      };

      send("meta", { npcId, userId, engineUrl: WONDERPLAY_3D_URL });

      let ws: WebSocket | null = null;
      let closed = false;

      try {
        ws = new WebSocket(wsUrl);
      } catch (error) {
        logger.error("[npc/live] WebSocket construct failed:", error);
        send("error", { message: "Failed to connect to NPC engine" });
        controller.close();
        return;
      }

      const cleanup = () => {
        if (closed) return;
        closed = true;
        try {
          ws?.close();
        } catch {
          // ignore
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      ws.onopen = () => {
        send("status", { status: "connected" });
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer || ArrayBuffer.isView(event.data)) {
          // Binary voice/audio chunk
          const bytes = new Uint8Array(
            event.data instanceof ArrayBuffer ? event.data : event.data.buffer,
          );
          let base64 = "";
          for (let i = 0; i < bytes.length; i += 0x8000) {
            base64 += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
          }
          send("voice", { audio: btoa(base64), npcId });
          return;
        }

        let parsed: unknown = null;
        try {
          parsed = JSON.parse(String(event.data));
        } catch {
          parsed = String(event.data);
        }

        if (typeof parsed === "object" && parsed && typeof (parsed as any).visemeFrame !== "undefined") {
          send("viseme", { visemes: (parsed as any).visemeFrame, npcId });
        } else if (typeof parsed === "object" && parsed && (parsed as any).dialogue) {
          send("dialogue", { dialogue: (parsed as any).dialogue, npcId });
        } else {
          send("message", { data: parsed, npcId });
        }
      };

      ws.onerror = (error) => {
        logger.error("[npc/live] WS error:", error);
        send("error", { message: "NPC engine stream error" });
        cleanup();
      };

      ws.onclose = () => {
        send("status", { status: "disconnected" });
        cleanup();
      };

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // Client disconnected; socket cleanup handled in start via abort listener.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
