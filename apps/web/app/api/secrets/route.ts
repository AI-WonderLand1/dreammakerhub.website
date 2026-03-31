import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { encryptSecret } from "@/lib/crypto/secrets";

function last4(secret: string) {
  const s = secret.trim();
  return s.length >= 4 ? s.slice(-4) : s;
}

export async function GET() {
  const supabase = supabaseRouteClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_secrets")
    .select("id,provider,label,last4,revoked_at,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ secrets: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = supabaseRouteClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const provider = String(body?.provider ?? "").trim().toLowerCase();
  const label = String(body?.label ?? "").trim();
  const secret = String(body?.secret ?? "").trim();

  if (!provider) return NextResponse.json({ error: "Provider required" }, { status: 400 });
  if (!secret) return NextResponse.json({ error: "Secret required" }, { status: 400 });
  if (provider.length > 40) return NextResponse.json({ error: "Provider too long" }, { status: 400 });
  if (label.length > 64) return NextResponse.json({ error: "Label too long" }, { status: 400 });

  const enc = encryptSecret(secret);

  const { error } = await supabase.from("user_secrets").insert({
    user_id: auth.user.id,
    provider,
    label: label || null,
    last4: last4(secret),
    ...enc,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Never return the plaintext secret again
  return NextResponse.json({ ok: true });
}
