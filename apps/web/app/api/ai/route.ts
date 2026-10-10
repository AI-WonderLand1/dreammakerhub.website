import { runModel } from "../../../core/ai/runModel";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { logUsage } from "@/lib/usage/log";
import { getClient } from "@/lib/supabase-service";
import { CostGateError, costGateResponse, reserveAiRequest } from "@/lib/billing/cost-guard.server";

export const runtime = "nodejs";

// Keep prompts intact: stripping < and > corrupts legitimate JSX, HTML and
// TypeScript requests. Prompt text is never interpreted as HTML in this API.
const hasProvider = () => [
  process.env.OPENROUTER_API_KEY,
  process.env.GROQ_API_KEY,
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_AI_API_KEY,
  process.env.CEREBRAS_API_KEY,
].some((key) => Boolean(key?.trim()));

const noStore = { "Cache-Control": "no-store" };

const FREE_BUILDER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const FREE_BUILDER_MONTHLY_REQUESTS = 20;
const BUILDER_OUTPUT_BUDGET = 2048;

// Operator-enabled beta path: only the explicit $0 OpenRouter model, no paid
// fallbacks, and a service-role-only atomic reservation BEFORE provider calls.
// This is distinct from the paid v2 billing path; never activate automatically.
async function runFreeBuilder(userId: string, message: string) {
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


export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to use the AI builder.", code: "AUTH_REQUIRED" },
      { status: 401, headers: noStore },
    );
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required", code: "BAD_REQUEST" }, { status: 400, headers: noStore });
  }
  const message = body.message.trim();
  if (message.length > 12000) {
    return NextResponse.json({ error: "Message exceeds the per-request budget", code: "COST_GUARD" }, { status: 413, headers: noStore });
  }

  // Explicit, quota-limited free beta remains off by default. This enables a
  // genuinely live builder before the paid cross-repo billing migration, without
  // allowing paid models or unmetered calls.
  if (process.env.FREE_BUILDER_AI_ENABLED === "true" &&
      process.env.BILLABLE_OPERATIONS_ENABLED !== "true") {
    try {
      return await runFreeBuilder(userId, message);
    } catch {
      return NextResponse.json(
        { error: "Free AI builder is unavailable. No changes were applied.", code: "AI_PROVIDER_UNAVAILABLE" },
        { status: 502, headers: noStore },
      );
    }
  }

  // Don't reserve scarce AI allowance when a provider isn't configured.
  // A present key does not guarantee that provider requests will succeed.
  if (!hasProvider()) {
    return NextResponse.json(
      { error: "The AI builder is not configured. No request was sent.", code: "AI_NOT_CONFIGURED" },
      { status: 503, headers: noStore },
    );
  }

  try {
    // The paid path retains its existing v2 reservation before model calls.
    await reserveAiRequest(userId, message.length, BUILDER_OUTPUT_BUDGET);
    // Metered calls must not silently retry other billable providers under the
    // same reservation. The shared model adapter chooses one configured route.
    const result = await runModel({
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: message }],
      temperature: 0.35,
      maxTokens: BUILDER_OUTPUT_BUDGET,
      singleProviderAttempt: true,
    });
    if (result.error || !result.text?.trim()) {
      // Provider error strings can contain credentials or private payloads.
      return NextResponse.json(
        { error: "The AI builder provider is temporarily unavailable. No changes were applied.", code: "AI_PROVIDER_UNAVAILABLE" },
        { status: 502, headers: noStore },
      );
    }
    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: result.tokens || Math.ceil((message.length + result.text.length) / 4),
    });
    return NextResponse.json({ text: result.text }, { headers: noStore });
  } catch (err: unknown) {
    if (err instanceof CostGateError) return costGateResponse(err);
    return NextResponse.json(
      { error: "The AI builder request failed. No confirmed response was received.", code: "AI_PROVIDER_UNAVAILABLE" },
      { status: 502, headers: noStore },
    );
  }
}
