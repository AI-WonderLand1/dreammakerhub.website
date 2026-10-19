import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { listGeneratedProjectGlbs } from "@/lib/3d/generated-asset-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Project-specific private GLB assets, listed only from the authenticated
 * user's storage prefix. Returned signed URLs are temporary and must never
 * be saved as permanent scene references.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  const projectId = req.nextUrl.searchParams.get("projectId")?.trim() || "";
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(projectId)) {
    return NextResponse.json({ error: "Select a valid project first" }, { status: 400 });
  }

  try {
    const assets = await listGeneratedProjectGlbs(auth.userId, projectId);
    return NextResponse.json({ assets, projectId }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logger.error("Unable to list project 3D assets", error);
    return NextResponse.json({ error: "Project assets are temporarily unavailable" }, { status: 503 });
  }
}
