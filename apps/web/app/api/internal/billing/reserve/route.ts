import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { authenticatedSupabaseUser } from "@/lib/supabase/authenticated-user.server";
import { PLAN_LIMITS } from "@/lib/billing/limits";
import { evaluateUsageAlerts } from "@/lib/billing/usage-alerts.server";
import { normalizeAiCredits, parseAiCostClass } from "@/lib/billing/ai-credit-policy";
import {
  CostGateError,
  reserveBillableUnits,
  verifiedCostPlan,
} from "@/lib/billing/cost-guard.server";

export const runtime = "nodejs";

const SOURCES = new Set(["ai-playground", "npc-ai-sim"]);
const FEATURES = new Set(["ai_tokens", "ai_requests", "render_credits"]);

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function serviceAuthorized(request: Request) {
  const expected = process.env.DREAMMAKERHUB_INTERNAL_BILLING_KEY?.trim() || "";
  const provided = request.headers.get("x-dmh-billing-key")?.trim() || "";
  return expected.length >= 32 && provided.length >= 32 && safeEqual(expected, provided);
}

export async function POST(request: Request) {
  if (!serviceAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized service" }, { status: 401 });
  }

  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: "Authenticated AI WONDERLAND user required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const source = body && typeof body.source === "string" ? body.source : "";
  const feature = body && typeof body.feature === "string" ? body.feature : "";
  const rawUnits = body && Number.isSafeInteger(body.units) ? body.units : 0;
  const costClass = parseAiCostClass(body?.costClass);

  if (!SOURCES.has(source) || !FEATURES.has(feature) || rawUnits < 1 || rawUnits > 1_000_000) {
    return NextResponse.json({ error: "Invalid usage reservation" }, { status: 400 });
  }

  try {
    const plan = await verifiedCostPlan(user.id);
    const limits = PLAN_LIMITS[plan];
    const billedUnits = feature === "ai_tokens"
      ? normalizeAiCredits(rawUnits, costClass)
      : rawUnits;
    const limit =
      feature === "ai_tokens" ? limits.aiTokensMonthly :
      feature === "ai_requests" ? limits.apiCallsMonthly :
      limits.renderCreditsMonthly;

    if (billedUnits > 0) {
      await reserveBillableUnits(
        user.id,
        feature as "ai_tokens" | "ai_requests" | "render_credits",
        billedUnits,
        limit,
        source as "ai-playground" | "npc-ai-sim",
      );
    }
    await evaluateUsageAlerts(user.id);

    return NextResponse.json({
      ok: true,
      plan,
      feature,
      rawUnits,
      billedUnits,
      costClass: feature === "ai_tokens" ? costClass : undefined,
      source,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const gate = error instanceof CostGateError
      ? error
      : new CostGateError("Unable to verify usage allowance.");
    return NextResponse.json(
      { error: gate.message, code: "COST_GUARD" },
      { status: gate.status },
    );
  }
}
