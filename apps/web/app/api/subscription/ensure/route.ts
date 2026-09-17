import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing Authorization token" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anon || !serviceRole) {
      return NextResponse.json({ ok: false, error: "Supabase env vars missing" }, { status: 500 });
    }

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }

    const userId = userRes.user.id;
    const admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingProfile, error: profileLookupError } = await admin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    if (profileLookupError) {
      return NextResponse.json({ ok: false, error: profileLookupError.message }, { status: 500 });
    }

    const plan = existingProfile?.subscription_tier || "free";

    if (!existingProfile) {
      const { error: insertError } = await admin
        .from("profiles")
        .insert({ id: userId, subscription_tier: "free" });

      if (insertError) {
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
      }
    }

    const currentMetadata = userRes.user.app_metadata ?? {};
    if (currentMetadata.plan !== plan) {
      const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...currentMetadata, plan },
      });
      if (metadataError) {
        return NextResponse.json({ ok: false, error: metadataError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, plan });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
