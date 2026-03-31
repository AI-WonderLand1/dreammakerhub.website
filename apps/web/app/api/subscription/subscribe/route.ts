import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

const ALLOWED_PLANS = new Set(["pro", "elite"]);

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing Authorization token" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body ?? {};

    if (!plan || typeof plan !== "string") {
      return NextResponse.json({ success: false, error: "No plan provided" }, { status: 400 });
    }

    if (!ALLOWED_PLANS.has(plan)) {
      return NextResponse.json({ success: false, error: "Invalid plan selection" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      return NextResponse.json({ success: false, error: "Supabase env vars missing" }, { status: 500 });
    }

    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const userId = userRes.user.id;

    // Stub “billing success”, then record the plan
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, plan }, { onConflict: "id" });

    if (upsertErr) {
      return NextResponse.json(
        { success: false, error: upsertErr.message, hint: "Do you have a profiles table with id + plan?" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
