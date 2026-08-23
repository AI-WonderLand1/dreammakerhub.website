import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const ingestSchema = z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid().nullish(),
  action: z.enum([
    "api.call",
    "ai.token",
    "ide.session",
    "runtime.minute",
    "compute.credit",
    "storage.byte",
  ]),
  apiCalls: z.number().int().min(0).max(10_000).default(0),
  tokensUsed: z.number().int().min(0).max(1_000_000).default(0),
  computeCreditsUsed: z.number().int().min(0).max(1_000_000).default(0),
  runtimeMinutes: z.number().int().min(0).max(60).default(0),
});

function internalKeyValid(req: NextRequest): boolean {
  const provided = req.headers.get("x-internal-key") || "";
  const expected = process.env.USAGE_INGEST_KEY || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    if (!internalKeyValid(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ingestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    const supabase = createClient<any>(url, key, { auth: { persistSession: false } });
    const e = parsed.data;
    const { error } = await supabase.from("usage_logs").insert({
      user_id: e.userId,
      project_id: e.projectId ?? null,
      action: e.action,
      api_calls: e.apiCalls,
      tokens_used: e.tokensUsed,
      compute_credits_used: e.computeCreditsUsed,
      runtime_minutes: e.runtimeMinutes,
    });

    if (error) {
      logger.error("Usage ingest insert failed:", error.message);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error("Usage ingest errored:", err?.message);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
