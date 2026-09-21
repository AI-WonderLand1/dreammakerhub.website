import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

function getBearerToken(req: NextRequest) {
  return (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1] || null;
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ ok: false, error: "Sign in to select a plan" }, { status: 401 });

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
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    // Never downgrade an existing paid account by selecting the free-plan button.
    const plan = profile?.subscription_tier || "free";
    if (!profile) {
      const { error: insertError } = await admin
        .from("profiles")
        .insert({ id: user.id, subscription_tier: "free" });
      if (insertError) throw insertError;
    }
    const currentMetadata = user.app_metadata ?? {};
    if (currentMetadata.plan !== plan) {
      const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...currentMetadata, plan },
      });
      if (metadataError) throw metadataError;
    }
    return NextResponse.json({ ok: true, plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Free plan setup failed", error);
    return NextResponse.json({ ok: false, error: "Could not load your plan. Please try again." }, { status: 502 });
  }
}
