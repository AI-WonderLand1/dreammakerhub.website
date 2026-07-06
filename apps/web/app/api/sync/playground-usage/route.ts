import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/sync/playground-usage
 * Receives usage data from the playground and stores it.
 * Called by playground.dreammakerhub.website to sync token usage.
 */
export async function POST(req: NextRequest) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();

    // Verify API key
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
    const { userId, tokens, model, sessionId, metadata } = body;

    if (!userId || tokens === undefined) {
      return NextResponse.json({ ok: false, error: "Missing userId or tokens", traceId }, { status: 400 });
    }

    // Upsert usage record
    const { data, error } = await supabase
      .from("playground_usage")
      .upsert({
        user_id: userId,
        total_tokens: tokens,
        last_model: model || "unknown",
        last_session_id: sessionId,
        metadata: metadata || {},
        synced_at: new Date().toISOString(),
        source: "playground",
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, traceId }, { status: 500 });
    }

    // Log the sync event
    await supabase.from("sync_log").insert({
      source: "playground",
      event_type: "usage",
      user_id: userId,
      payload: { tokens, model, sessionId },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, data, traceId });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Sync failed", traceId }, { status: 500 });
  }
}

/**
 * GET /api/sync/playground-usage
 * Get usage data for a user (from both main site and playground).
 */
export async function GET(req: NextRequest) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing userId", traceId }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("playground_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ ok: false, error: error.message, traceId }, { status: 500 });
    }

    // Also get main site usage
    const { data: mainUsage } = await supabase
      .from("api_usage")
      .select("tokens_used")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      ok: true,
      userId,
      playground: data || { total_tokens: 0, last_model: null },
      mainSite: { tokens_used: mainUsage?.tokens_used || 0 },
      combined: {
        totalTokens: (data?.total_tokens || 0) + (mainUsage?.tokens_used || 0),
        playgroundTokens: data?.total_tokens || 0,
        mainSiteTokens: mainUsage?.tokens_used || 0,
      },
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Fetch failed", traceId }, { status: 500 });
  }
}
