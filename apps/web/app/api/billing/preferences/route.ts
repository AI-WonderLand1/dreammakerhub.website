import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";

const DEFAULTS = {
  token_alert_percent: 80,
  api_alert_percent: 80,
  storage_alert_percent: 80,
  in_app_alerts: true,
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function percent(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 50 && n <= 100 ? n : fallback;
}

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing settings are unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("user_billing_preferences")
    .select("token_alert_percent,api_alert_percent,storage_alert_percent,in_app_alerts")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load billing alerts" }, { status: 500 });
  return NextResponse.json({ preferences: data || DEFAULTS }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing settings are unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const preferences = {
    user_id: user.id,
    token_alert_percent: percent((body as any).token_alert_percent, DEFAULTS.token_alert_percent),
    api_alert_percent: percent((body as any).api_alert_percent, DEFAULTS.api_alert_percent),
    storage_alert_percent: percent((body as any).storage_alert_percent, DEFAULTS.storage_alert_percent),
    in_app_alerts: typeof (body as any).in_app_alerts === "boolean" ? (body as any).in_app_alerts : true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_billing_preferences")
    .upsert(preferences, { onConflict: "user_id" })
    .select("token_alert_percent,api_alert_percent,storage_alert_percent,in_app_alerts")
    .single();
  if (error) return NextResponse.json({ error: "Could not save billing alerts" }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
