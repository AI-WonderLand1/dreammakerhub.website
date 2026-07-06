import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/sync/playground-status
 * Real-time status sync from playground (active sessions, model usage, errors).
 */
export async function POST(req: NextRequest) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();

    const apiKey = req.headers.get("x-sync-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing sync key", traceId }, { status: 401 });
    }

    const { data: validKey } = await supabase
      .from("sync_keys")
      .select("id")
      .eq("key", apiKey)
      .eq("active", true)
      .single();

    if (!validKey) {
      return NextResponse.json({ ok: false, error: "Invalid sync key", traceId }, { status: 401 });
    }

    const body = await req.json();
    const { userId, status, sessionId, model, error: errorMsg, metadata } = body;

    if (!userId || !status) {
      return NextResponse.json({ ok: false, error: "Missing userId or status", traceId }, { status: 400 });
    }

    // Store status update
    const { error } = await supabase.from("playground_sessions").insert({
      user_id: userId,
      status, // "started", "active", "completed", "error"
      session_id: sessionId,
      model: model || "unknown",
      error_message: errorMsg || null,
      metadata: metadata || {},
      source: "playground",
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, traceId }, { status: 500 });
    }

    // If error, log it for monitoring
    if (status === "error" && errorMsg) {
      await supabase.from("sync_log").insert({
        source: "playground",
        event_type: "error",
        user_id: userId,
        payload: { error: errorMsg, model, sessionId },
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, traceId });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Status sync failed", traceId }, { status: 500 });
  }
}

/**
 * GET /api/sync/playground-status
 * Get active playground sessions and status.
 */
export async function GET(req: NextRequest) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();
    const userId = req.nextUrl.searchParams.get("userId");

    let query = supabase
      .from("playground_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, traceId }, { status: 500 });
    }

    // Get active sessions count
    const activeSessions = (data || []).filter(s => s.status === "active" || s.status === "started");

    return NextResponse.json({
      ok: true,
      sessions: data || [],
      activeCount: activeSessions.length,
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Fetch failed", traceId }, { status: 500 });
  }
}
