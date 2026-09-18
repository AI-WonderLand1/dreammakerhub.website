import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/app/utils/supabase/server";
import { getUserConfessions, searchMem0Confessions, isMem0Enabled } from "@/lib/ai/mem0Client";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const querySchema = z.object({
  projectId: z.string().regex(/^(sitewide|[a-f0-9-]{36})$/i).optional(),
  query: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export async function GET(req: NextRequest) {
  const traceId = randomUUID();
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to view your confessions." }, traceId },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const params = req.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      projectId: params.get("projectId") || undefined,
      query: params.get("query") || undefined,
      limit: params.get("limit") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "Invalid confession filters." }, traceId }, { status: 400 });
    }
    if (!isMem0Enabled()) {
      return NextResponse.json(
        { ok: false, error: { code: "STORAGE_NOT_CONFIGURED", message: "Confession storage is unavailable." }, traceId },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { projectId, query, limit } = parsed.data;
    const confessions = query
      ? await searchMem0Confessions(user.id, query, limit)
      : await getUserConfessions(user.id, projectId, limit);
    return NextResponse.json({ ok: true, confessions, source: "storage" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("Confessions fetch error", { kind: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json(
      { ok: false, error: { code: "STORAGE_UNAVAILABLE", message: "Could not load saved confessions." }, traceId },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
