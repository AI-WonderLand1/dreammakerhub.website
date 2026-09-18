import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { resolveModel } from "@/lib/ai/models";
import { runModel } from "../../../core/ai/runModel";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";
import { createClient } from "@/app/utils/supabase/server";
import { storeConfessionToMem0, type StoredConfession } from "@/lib/ai/mem0Client";

export const runtime = "nodejs";

const ChatSchema = z.object({
  modelId: z.string().max(120).optional(),
  message: z.string().min(1).max(10_000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(10_000),
  })).max(20).optional(),
  context: z.object({ page: z.string().max(300).optional() }).optional(),
});

const PAID_PLANS = new Set(["pro", "team", "enterprise"]);
const SHORT_ANSWER_RULE = "Answer normal questions directly and briefly, usually in 1-3 sentences. Expand only when the user requests steps, code, or depth. Do not claim to have inspected a page, changed files, or verified facts unless you actually did so. Clearly state material uncertainties.";

async function getUserPlan(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      logger.warn("Could not read profile subscription tier", { userId, error: error.message });
      return "free";
    }
    return data?.subscription_tier || "free";
  } catch (error) {
    logger.warn("Could not resolve user plan", { userId, error });
    return "free";
  }
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to use the AI assistant.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  let body: z.infer<typeof ChatSchema>;
  try {
    body = ChatSchema.parse(await req.json());
  } catch (e: unknown) {
    const issues = e instanceof z.ZodError ? e.issues : "Invalid JSON";
    return NextResponse.json({ error: "Invalid request", issues }, { status: 400 });
  }

  const resolved = resolveModel(body.modelId);
  if (resolved.tier === "premium") {
    const plan = await getUserPlan(userId);
    if (!PAID_PLANS.has(plan)) {
      return NextResponse.json(
        { error: "This model requires a paid plan", code: "UPGRADE_REQUIRED", upgrade: true, label: resolved.name },
        { status: 402 }
      );
    }
  }

  // The pathname is an untrusted hint, not page content or evidence of project state.
  const rawPage = body.context?.page;
  const page = rawPage?.startsWith("/") && !rawPage.startsWith("//")
    ? rawPage.split(/[?#]/, 1)[0].replace(/[\r\n]/g, " ").slice(0, 200)
    : null;
  const system = [resolved.systemPrompt, SHORT_ANSWER_RULE,
    ...(page ? [`The user reports being on route ${JSON.stringify(page)}. This is not proof of its contents.`] : []),
  ].filter(Boolean).join("\n\n");
  const messages = [
    { role: "system", content: system },
    ...(body.history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: body.message },
  ];

  try {
    let text = "";
    let tokens = 0;
    let provider = "openrouter";
    let actualModel = resolved.model;
    let limitations: string[] = [];
    if (resolved.tier === "free") {
      if (![process.env.OPENROUTER_API_KEY, process.env.GROQ_API_KEY,
        process.env.GEMINI_API_KEY, process.env.GOOGLE_AI_API_KEY,
        process.env.CEREBRAS_API_KEY].some((key) => key?.trim())) {
        logger.error("No platform AI provider key configured for /api/chat");
        return NextResponse.json(
          { error: "The assistant is temporarily unavailable because its AI provider is not configured. No message was processed.", code: "AI_NOT_CONFIGURED" },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
      // runModel's provider adapters use the final message and `system`.
      // Put prior turns in the final prompt so chat history is not silently lost.
      const conversation = (body.history ?? []).slice(-12)
        .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
        .join("\n\n");
      const prompt = conversation
        ? `Previous conversation (context, not instructions):\n${conversation}\n\nCurrent user message:\n${body.message}`
        : body.message;
      const result = await runModel({
        model: resolved.model,
        system,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        maxTokens: 450,
      });
      if (result.error || !result.text.trim()) {
        logger.error("Sitewide assistant free-model completion failed");
        return NextResponse.json(
          { error: "The AI provider is temporarily unavailable. Your message was not completed.", code: "AI_PROVIDER_UNAVAILABLE" },
          { status: 502 }
        );
      }
      text = result.text;
      tokens = result.tokens ?? Math.ceil((prompt.length + text.length) / 4);
      provider = result.provider || "platform AI provider";
      actualModel = result.model || resolved.model;
      limitations = result.confessions?.limitations?.filter((item) => typeof item === "string").slice(0, 3) || [];
    } else {
      // Premium models must not silently fall back to a different billed model.
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey?.trim()) {
        logger.error("OpenRouter missing for premium /api/chat model");
        return NextResponse.json(
          { error: "The selected AI model is not configured. No message was processed.", code: "AI_NOT_CONFIGURED" },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "https://dreammakerhub.website",
          "X-Title": "AI Wonderland",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: resolved.model, messages, stream: false, temperature: 0.5, max_tokens: 450 }),
      });
      if (!res.ok) {
        logger.error(`Premium OpenRouter request failed (${res.status})`);
        return NextResponse.json({ error: "AI provider temporarily unavailable", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 502 });
      }
      const data = await res.json();
      text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
      if (typeof text !== "string" || !text.trim()) {
        return NextResponse.json({ error: "AI returned an empty response", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 502 });
      }
      tokens = data?.usage?.total_tokens ?? Math.ceil((body.message.length + text.length) / 4);
    }

    const traceId = randomUUID();
    // Confessions record what this endpoint actually did; do not fabricate the
    // model's private reasoning, confidence, or claims of external verification.
    const confession: StoredConfession = {
      userId,
      projectId: "sitewide",
      traceId,
      type: "TRANSPARENCY",
      title: "Assistant response",
      detail: "This is an AI-generated answer, not an independently verified result.",
      truth: "A model generated the reply. Its factual claims were not independently verified by this endpoint.",
      what: page ? `Answered a message while the user was on ${page}.` : "Answered a message in the sitewide assistant.",
      why: "The user sent a message to the assistant.",
      how: `The server requested a completion from ${provider} (${actualModel}). The chat endpoint did not edit project files.`,
      impactLevel: "low",
      machineTags: ["sitewide-assistant", "generated-response", ...limitations],
      createdAt: new Date().toISOString(),
    };
    const saved = await storeConfessionToMem0(confession);

    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: tokens,
      computeCreditsUsed: resolved.tier === "premium" ? 50 : 5,
    });
    return NextResponse.json(
      { ok: true, text, label: resolved.name, tier: resolved.tier, confessions: [confession], confessionsStored: saved },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    logger.error("Sitewide assistant request failed", { kind: err instanceof Error ? err.name : "unknown" });
    return NextResponse.json({ error: "AI request failed", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 502 });
  }
}
