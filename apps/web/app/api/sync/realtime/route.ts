import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

/**
 * GET /api/sync/realtime
 * Server-Sent Events endpoint for real-time playground updates.
 * 
 * Query params:
 *   - userId: Filter events for a specific user
 *   - events: Comma-separated event types to subscribe to (usage, tokens, status, quota)
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const eventTypes = req.nextUrl.searchParams.get("events")?.split(",") || ["usage", "tokens", "status"];

  // Verify API key
  const apiKey = req.headers.get("x-sync-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing sync key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: validKey } = await supabase
    .from("sync_keys")
    .select("id")
    .eq("key", apiKey)
    .eq("active", true)
    .single();

  if (!validKey) {
    return new Response(JSON.stringify({ error: "Invalid sync key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", userId, timestamp: new Date().toISOString() })}\n\n`);

      const channels: any[] = [];

      const isValidEvent = (payload: any) => {
        if (!userId) return true;
        const row = payload.new || payload.old;
        if (!row) return false;
        return row.user_id === userId;
      };

      if (eventTypes.includes("usage")) {
        const ch = supabase
          .channel(`sse-usage-${userId || "all"}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "playground_usage", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, (payload) => {
            if (!isValidEvent(payload)) return;
            controller.enqueue(`data: ${JSON.stringify({ type: "usage", event: payload.eventType, data: payload.new, timestamp: new Date().toISOString() })}\n\n`);
          })
          .subscribe();
        channels.push(ch);
      }

      if (eventTypes.includes("tokens")) {
        const ch = supabase
          .channel(`sse-tokens-${userId || "all"}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "token_balances", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, (payload) => {
            if (!isValidEvent(payload)) return;
            controller.enqueue(`data: ${JSON.stringify({ type: "tokens", event: payload.eventType, data: payload.new, timestamp: new Date().toISOString() })}\n\n`);
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "token_transactions", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, (payload) => {
            if (!isValidEvent(payload)) return;
            controller.enqueue(`data: ${JSON.stringify({ type: "transaction", event: "INSERT", data: payload.new, timestamp: new Date().toISOString() })}\n\n`);
          })
          .subscribe();
        channels.push(ch);
      }

      if (eventTypes.includes("status")) {
        const ch = supabase
          .channel(`sse-status-${userId || "all"}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "playground_sessions", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, (payload) => {
            if (!isValidEvent(payload)) return;
            controller.enqueue(`data: ${JSON.stringify({ type: "status", event: payload.eventType, data: payload.new, timestamp: new Date().toISOString() })}\n\n`);
          })
          .subscribe();
        channels.push(ch);
      }

      if (eventTypes.includes("quota")) {
        const ch = supabase
          .channel(`sse-quota-${userId || "all"}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "usage_quotas", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, (payload) => {
            if (!isValidEvent(payload)) return;
            controller.enqueue(`data: ${JSON.stringify({ type: "quota", event: payload.eventType, data: payload.new, timestamp: new Date().toISOString() })}\n\n`);
          })
          .subscribe();
        channels.push(ch);
      }

      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`);
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        channels.forEach((ch) => supabase.removeChannel(ch));
        controller.close();
      });
    },
  });

  const allowedOrigins = [
    "https://playground.dreammakerhub.website",
    "https://dreammakerhub.website",
    "http://localhost:3000",
    "http://localhost:3001",
  ];
  const origin = req.headers.get("origin") || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": corsOrigin,
    },
  });
}
