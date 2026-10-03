import "server-only";

import { Buffer } from "node:buffer";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/lib/billing/limits";
import { logger } from "@/lib/logger";

type AlertMetric = "ai_tokens" | "api_requests" | "storage" | "three_d_generations";
type AlertRow = {
  id: string;
  metric: AlertMetric;
  threshold_kind: "percent" | "absolute";
  threshold_value: number | string;
  channels: string[];
  destination_email: string | null;
  destination_phone: string | null;
  last_triggered_period_start: string | null;
};

type UsageTotals = {
  plan: string;
  period_start: string;
  ai_tokens: number;
  api_requests: number;
  storage: number;
  three_d_generations: number;
};

function serviceClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function usageAlertProviderStatus() {
  return {
    email: Boolean(
      process.env.RESEND_API_KEY?.trim() &&
      (process.env.BILLING_ALERT_FROM_EMAIL || process.env.RESEND_FROM_EMAIL)?.trim()
    ),
    sms: Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
    ),
  };
}

function normalizePlan(value: string) {
  const plan = value.toLowerCase();
  return plan === "creator" || plan === "pro" || plan === "studio" || plan === "team" || plan === "enterprise" ? plan : "free";
}

function metricLabel(metric: AlertMetric) {
  if (metric === "ai_tokens") return "AI credits";
  if (metric === "api_requests") return "API requests";
  if (metric === "storage") return "Storage";
  return "3D generations";
}

function metricLimit(metric: AlertMetric, plan: keyof typeof PLAN_LIMITS) {
  const limits = PLAN_LIMITS[plan];
  if (metric === "ai_tokens") return limits.aiTokensMonthly;
  if (metric === "api_requests") return limits.apiCallsMonthly;
  if (metric === "storage") return limits.storageLimit;
  if (metric === "three_d_generations") return limits.renderCreditsMonthly;
  return null;
}

async function sendEmail(to: string, subject: string, message: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.BILLING_ALERT_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "").trim();
  if (!apiKey || !from) throw new Error("Email delivery is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: message,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`Email provider returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }
}

async function sendSms(to: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) throw new Error("SMS delivery is not configured");

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`SMS provider returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }
}

export async function evaluateUsageAlerts(userId: string) {
  const supabase = serviceClient();
  if (!supabase || !userId) return;

  const [{ data: alerts, error: alertError }, { data: totals, error: totalsError }] = await Promise.all([
    supabase
      .from("user_usage_alerts")
      .select("id,metric,threshold_kind,threshold_value,channels,destination_email,destination_phone,last_triggered_period_start")
      .eq("user_id", userId)
      .eq("enabled", true),
    supabase.rpc("get_usage_totals_for_alerts", { p_user_id: userId }),
  ]);

  if (alertError || totalsError || !totals) {
    logger.error("Unable to evaluate usage alerts", alertError || totalsError);
    return;
  }

  const usage = totals as UsageTotals;
  const plan = normalizePlan(usage.plan);
  const periodStart = new Date(usage.period_start).toISOString();
  const providers = usageAlertProviderStatus();

  for (const alert of (alerts || []) as AlertRow[]) {
    if (
      alert.last_triggered_period_start &&
      new Date(alert.last_triggered_period_start).toISOString() === periodStart
    ) {
      continue;
    }

    const current = Number(usage[alert.metric] ?? 0);
    const threshold = Number(alert.threshold_value);
    const limit = metricLimit(alert.metric, plan);
    const measured = alert.threshold_kind === "percent" && limit
      ? (current / limit) * 100
      : current;

    if (!Number.isFinite(measured) || measured < threshold) continue;

    const label = metricLabel(alert.metric);
    const valueText = alert.threshold_kind === "percent"
      ? `${Math.round(measured)}% used`
      : `${current} generations`;
    const message = `AI WONDERLAND usage alarm: ${label} reached ${valueText}. Your configured threshold is ${threshold}${alert.threshold_kind === "percent" ? "%" : ""}.`;
    const status: Record<string, string> = {};

    for (const channel of alert.channels || []) {
      if (channel === "in_app") {
        status.in_app = "triggered";
        continue;
      }

      if (channel === "email") {
        if (!providers.email || !alert.destination_email) {
          status.email = "not_configured";
          continue;
        }
        try {
          await sendEmail(alert.destination_email, `AI WONDERLAND ${label} usage alarm`, message);
          status.email = "sent";
        } catch (error) {
          logger.error("Usage alert email delivery failed", error);
          status.email = "failed";
        }
        continue;
      }

      if (channel === "sms") {
        if (!providers.sms || !alert.destination_phone) {
          status.sms = "not_configured";
          continue;
        }
        try {
          await sendSms(alert.destination_phone, message);
          status.sms = "sent";
        } catch (error) {
          logger.error("Usage alert SMS delivery failed", error);
          status.sms = "failed";
        }
      }
    }

    await supabase
      .from("user_usage_alerts")
      .update({
        last_triggered_period_start: periodStart,
        last_triggered_value: measured,
        last_delivery_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alert.id)
      .eq("user_id", userId);
  }
}
