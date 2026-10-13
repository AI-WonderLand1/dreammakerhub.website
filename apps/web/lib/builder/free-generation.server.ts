import 'server-only';
import { NextResponse } from 'next/server';
import { getClient } from '@/lib/supabase-service';
import { logUsage } from '@/lib/usage/log';

// Single provider, quota-limited CPU-independent free beta generation.
// Shared by builder actions and template generation. No fallback to paid models.
const FREE_BUILDER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const FREE_BUILDER_MONTHLY_REQUESTS = 20;
const BUILDER_OUTPUT_BUDGET = 2048;

// Operator-enabled beta path: only the explicit $0 OpenRouter model, no paid
// fallbacks, and a service-role-only atomic reservation BEFORE provider calls.
// This is distinct from the paid v2 billing path; never activate automatically.
export async function runFreeBuilder(userId: string, message: string) {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "The free AI builder provider is not configured.", code: "AI_NOT_CONFIGURED" },
      { status: 503, headers: noStore },
    );
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return NextResponse.json(
      { error: "AI usage accounting is unavailable. No request was sent.", code: "COST_GUARD" },
      { status: 503, headers: noStore },
    );
  }

  // This function is already installed in production. It enforces a concurrent
  // per-user UTC-month limit and is executable only with the service role.
  const { data, error } = await getClient().rpc("reserve_billable_units", {
    p_user_id: userId,
    p_feature: "ai_requests",
    p_units: 1,
    p_limit: FREE_BUILDER_MONTHLY_REQUESTS,
  });
  if (error || typeof data !== "boolean") {
    return NextResponse.json(
      { error: "AI request limits are unavailable. No request was sent.", code: "COST_GUARD" },
      { status: 503, headers: noStore },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "The free AI builder monthly request limit has been reached.", code: "COST_GUARD" },
      { status: 429, headers: noStore },
    );
  }

  // Do not call the shared fallback model router here. It could select a paid
  // provider. A failed free-model request stays failed.
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dreammakerhub.website",
      "X-Title": "AI WONDERLAND Builder",
    },
    body: JSON.stringify({
      model: FREE_BUILDER_MODEL,
      messages: [{ role: "user", content: message }],
      max_tokens: BUILDER_OUTPUT_BUDGET,
      temperature: 0.35,
      stream: false,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    return NextResponse.json(
      { error: "Free AI generation is temporarily unavailable. No changes were applied.", code: "AI_PROVIDER_UNAVAILABLE" },
      { status: 502, headers: noStore },
    );
  }
  const payload = await response.json().catch(() => null);
  const resultText = payload?.choices?.[0]?.message?.content;
  if (typeof resultText !== "string" || !resultText.trim()) {
    return NextResponse.json(
      { error: "Free AI returned no usable builder instructions.", code: "AI_PROVIDER_UNAVAILABLE" },
      { status: 502, headers: noStore },
    );
  }
  await logUsage({
    userId,
    action: "ai.token",
    apiCalls: 1,
    tokensUsed: typeof payload?.usage?.total_tokens === "number"
      ? payload.usage.total_tokens
      : Math.ceil((message.length + resultText.length) / 4),
  });
  return NextResponse.json({ text: resultText, model: FREE_BUILDER_MODEL }, { headers: noStore });
}


