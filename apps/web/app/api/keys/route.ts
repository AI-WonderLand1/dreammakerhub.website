import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { makeApiToken } from "@/lib/crypto/token";

export async function GET() {
  const supabase = supabaseRouteClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id,name,prefix,last_used_at,revoked_at,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = supabaseRouteClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (name.length > 64) return NextResponse.json({ error: "Name too long" }, { status: 400 });

  const prefix = process.env.WONDER_API_KEY_PREFIX ?? "wb_live_";
  const { token, token_hash, prefix: prefix12 } = makeApiToken(prefix);

  const { error } = await supabase.from("api_keys").insert({
    user_id: auth.user.id,
    name,
    prefix: prefix12,
    token_hash,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // IMPORTANT: return token only once
  return NextResponse.json({
    token,
    prefix: prefix12,
  });
}
