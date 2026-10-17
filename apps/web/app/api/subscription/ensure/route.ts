import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

function getBearerToken(req: NextRequest) {
  return (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1] || null;
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ ok: false, error: "Sign in to start your trial" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceRole) {
    return NextResponse.json({ ok: false, error: "Subscription service is temporarily unavailable" }, { status: 503 });
  }

  try {
    const userClient = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user?.id) {
      return NextResponse.json({ ok: false, error: "Session expired. Sign in again." }, { status: 401 });
    }

    const admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: subscriptions, error: subscriptionError } = await admin
      .from("subscriptions").select("plan,status,stripe_subscription_id")
      .eq("user_id", user.id).in("status", ["active", "trialing"]);
    if (subscriptionError) throw subscriptionError;
    const paid = subscriptions?.find((row) =>
      ["creator", "pro", "studio", "team", "enterprise"].includes(row.plan) &&
      row.stripe_subscription_id?.startsWith("sub_"));
    if (paid) return NextResponse.json({ ok: true, plan: paid.plan });

    // Database time and a unique user_id make concurrent/repeated starts idempotent.
    const { data, error } = await admin.rpc("start_account_trial", { p_user_id: user.id });
    if (error) throw error;
    const trial = Array.isArray(data) ? data[0] : data;
    if (!trial?.expires_at) throw new Error("Trial could not be started");
    if (Date.parse(trial.expires_at) <= Date.now()) {
      return NextResponse.json({ ok: false, error: "Your free trial has ended. Choose a paid membership to continue." }, { status: 402 });
    }
    return NextResponse.json({ ok: true, plan: "trial", expiresAt: trial.expires_at }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("Trial setup failed", error);
    return NextResponse.json({ ok: false, error: "Could not load your plan. Please try again." }, { status: 502 });
  }
}
