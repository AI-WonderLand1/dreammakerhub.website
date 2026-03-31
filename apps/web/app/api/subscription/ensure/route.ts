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

    if (!url || !anon) {
      return NextResponse.json({ ok: false, error: "Supabase env vars missing" }, { status: 500 });
    }

    // Use the user's JWT to act as the user (RLS-safe)
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }

    const userId = userRes.user.id;

    /**
     * Store plan in a table (recommended).
     * This assumes you have a `profiles` table with:
     * - id (uuid, primary key, matches auth.users.id)
     * - plan (text)
     *
     * If you don't have it yet, you can create later.
     * For now, this will error if the table doesn't exist.
     */
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, plan: "free" }, { onConflict: "id" });

    if (upsertErr) {
      return NextResponse.json(
        { ok: false, error: upsertErr.message, hint: "Do you have a profiles table with id + plan?" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, plan: "free" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
