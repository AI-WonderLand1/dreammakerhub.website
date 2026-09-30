import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { evaluateUsageAlerts, usageAlertProviderStatus } from "@/lib/billing/usage-alerts.server";

const METRICS = new Set(["ai_tokens", "api_requests", "storage", "three_d_generations"]);
const CHANNELS = new Set(["in_app", "email", "sms"]);

function admin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function parseAlert(body: any, userEmail: string | null | undefined) {
  const metric = typeof body?.metric === "string" ? body.metric : "";
  if (!METRICS.has(metric)) throw new Error("Invalid alarm metric");

  const thresholdKind = metric === "three_d_generations" ? "absolute" : "percent";
  const thresholdValue = Number(body?.threshold_value);
  if (!Number.isFinite(thresholdValue) || thresholdValue <= 0) throw new Error("Threshold must be greater than zero");
  if (thresholdKind === "percent" && thresholdValue > 100) throw new Error("Percentage threshold cannot exceed 100");

  const channels = Array.isArray(body?.channels)
    ? [...new Set(body.channels.filter((value: unknown) => typeof value === "string" && CHANNELS.has(value as string)))]
    : ["in_app"];
  if (channels.length === 0) throw new Error("Choose at least one alarm delivery channel");

  const providers = usageAlertProviderStatus();
  const email = typeof body?.destination_email === "string" && body.destination_email.trim()
    ? body.destination_email.trim()
    : userEmail || null;
  const phone = typeof body?.destination_phone === "string" ? body.destination_phone.trim() : null;

  if (channels.includes("email")) {
    if (!providers.email) throw new Error("Email alarm delivery is not configured");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid alarm email address");
  }
  if (channels.includes("sms")) {
    if (!providers.sms) throw new Error("SMS alarm delivery is not configured");
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Enter the SMS number in E.164 format, for example +13125551234");
  }

  return {
    metric,
    threshold_kind: thresholdKind,
    threshold_value: thresholdValue,
    channels,
    destination_email: channels.includes("email") ? email : null,
    destination_phone: channels.includes("sms") ? phone : null,
    enabled: body?.enabled !== false,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing alarm storage is unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("user_usage_alerts")
    .select("id,metric,threshold_kind,threshold_value,channels,destination_email,destination_phone,enabled,last_triggered_period_start,last_triggered_value,last_delivery_status,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load usage alarms" }, { status: 500 });

  return NextResponse.json({
    alerts: data || [],
    providers: usageAlertProviderStatus(),
    defaultEmail: user.email || null,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing alarm storage is unavailable" }, { status: 503 });

  try {
    const body = await request.json().catch(() => ({}));
    const input = parseAlert(body, user.email);
    const { data, error } = await supabase
      .from("user_usage_alerts")
      .insert({ user_id: user.id, ...input })
      .select("*")
      .single();
    if (error) throw error;
    await evaluateUsageAlerts(user.id);
    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create usage alarm" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing alarm storage is unavailable" }, { status: 503 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) throw new Error("Alarm id is required");
    const input = parseAlert(body, user.email);
    const { data, error } = await supabase
      .from("user_usage_alerts")
      .update({ ...input, last_triggered_period_start: null, last_triggered_value: null, last_delivery_status: {} })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    await evaluateUsageAlerts(user.id);
    return NextResponse.json({ alert: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update usage alarm" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Billing alarm storage is unavailable" }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Alarm id is required" }, { status: 400 });

  const { error } = await supabase
    .from("user_usage_alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete usage alarm" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
