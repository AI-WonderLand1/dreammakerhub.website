import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const [{ data, error }, balanceResult] = await Promise.all([
      supabase.rpc("get_usage_summary"),
      supabase
        .from("user_token_balances")
        .select("purchased_tokens")
        .eq("user_id", userData.user.id)
        .maybeSingle(),
    ]);
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to load usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      usage: {
        ...data,
        purchased_tokens: Number(balanceResult.data?.purchased_tokens ?? 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
