import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/sync/realtime
 * Server-Sent Events endpoint for real-time playground updates.
 * 
 * Query params:
 *   - userId: Filter events for a specific user
 *   - events: Comma-separated event types to subscribe to (usage, tokens, status)
 * 
 * Usage:
 *   const eventSource = new EventSource('/api/sync/realtime?userId=user-123');
 *   eventSource.onmessage = (event) => {
 *     const data = JSON.parse(event.data);
 *     console.log('Real-time update:', data);
 *   };
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

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", userId, timestamp: new Date().toISOString() })}\n\n`);

      // Set up Supabase Realtime subscriptions with user-scoped channels
      const channels: any[] = [];

      // Helper: validate event belongs to the requested user
      const isValidEvent = (payload: any) => {
        if (!userId) return true; // No filter = allow all (admin mode)
        const row = payload.new || payload.old;
        if (!row) return false;
        return row.user_id === userId;
      };

      if (eventTypes.includes("usage")) {
        const usageChannel = supabase
          .channel(`sse-usage-${userId || 'all'}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "playground_usage", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              if (!isValidEvent(payload)) return;
              const event = {
                type: "usage",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .subscribe();
        channels.push(usageChannel);
      }

      if (eventTypes.includes("tokens")) {
        const tokensChannel = supabase
          .channel(`sse-tokens-${userId || 'all'}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "token_balances", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              if (!isValidEvent(payload)) return;
              const event = {
                type: "tokens",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "token_transactions", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              if (!isValidEvent(payload)) return;
              const event = {
                type: "transaction",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .subscribe();
        channels.push(tokensChannel);
      }

      if (eventTypes.includes("status")) {
        const statusChannel = supabase
          .channel(`sse-status-${userId || 'all'}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "playground_sessions", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              if (!isValidEvent(payload)) return;
              const event = {
                type: "status",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .subscribe();
        channels.push(statusChannel);
      }

      if (eventTypes.includes("quota")) {
        const quotaChannel = supabase
          .channel(`sse-quota-${userId || 'all'}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "usage_quotas", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              if (!isValidEvent(payload)) return;
              const event = {
                type: "quota",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .subscribe();
        channels.push(quotaChannel);
      }
          )
          .subscribe();
        channels.push(usageChannel);
      }

      if (eventTypes.includes("tokens")) {
        const tokensChannel = supabase
          .channel("realtime-tokens")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "token_balances", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              const event = {
                type: "tokens",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "token_transactions", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              const event = {
                type: "transaction",
                event: "INSERT",
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .subscribe();
        channels.push(tokensChannel);
      }

      if (eventTypes.includes("status")) {
        const statusChannel = supabase
          .channel("realtime-status")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "playground_sessions", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) },
            (payload) => {
              const event = {
                type: "status",
                event: payload.eventType,
                data: payload.new,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            }
          )
          .subscribe();
        channels.push(statusChannel);
      }

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`);
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Clean up on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        channels.forEach((ch) => supabase.removeChannel(ch));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
