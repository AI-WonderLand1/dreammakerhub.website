import { NextRequest, NextResponse } from "next/server";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { getClient } from "@/lib/supabase-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatedSupabaseUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Usage accounting is unavailable" }, { status: 503 });
    }

    const supabase = getClient();
    const monthStart = new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      1,
    )).toISOString().slice(0, 10);

    const [counterResult, balanceResult, projectResult, recentResult] = await Promise.all([
      supabase
        .from("billable_usage_counters")
        .select("feature,units")
        .eq("user_id", user.id)
        .eq("period_start", monthStart),
      supabase
        .from("user_token_balances")
        .select("purchased_tokens,purchased_render_credits")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("id,storage_used")
        .eq("owner_id", user.id)
        .neq("status", "deleted"),
      supabase
        .from("cross_repo_usage_events")
        .select("source,feature,units,purchased_units,created_at")
        .eq("user_id", user.id)
        .eq("period_start", monthStart)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (counterResult.error || balanceResult.error || projectResult.error || recentResult.error) {
      return NextResponse.json({ error: "Failed to load unified usage" }, { status: 500 });
    }

    const counters = new Map<string, number>();
    for (const row of counterResult.data ?? []) {
      counters.set(row.feature, Number(row.units || 0));
    }

    const projects = projectResult.data ?? [];
    const storageUsed = projects.reduce((sum, project) => sum + Number(project.storage_used || 0), 0);
    const now = new Date();
    const periodReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan,status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      usage: {
        plan: subscription?.plan || "free",
        period_start: new Date(monthStart + "T00:00:00.000Z").toISOString(),
        period_reset: periodReset,
        api_calls_used: counters.get("ai_requests") || 0,
        tokens_used: counters.get("ai_tokens") || 0,
        render_credits_used: counters.get("render_credits") || 0,
        purchased_tokens: Number(balanceResult.data?.purchased_tokens ?? 0),
        purchased_render_credits: Number(balanceResult.data?.purchased_render_credits ?? 0),
        storage_used: storageUsed,
        projects_count: projects.length,
        recent_activity: (recentResult.data ?? []).map((event) => ({
          action: event.feature,
          source: event.source,
          tokens_used: event.feature === "ai_tokens" ? Number(event.units || 0) : 0,
          render_credits_used: event.feature === "render_credits" ? Number(event.units || 0) : 0,
          api_calls: event.feature === "ai_requests" ? Number(event.units || 0) : 0,
          purchased_units: Number(event.purchased_units || 0),
          created_at: event.created_at,
        })),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
