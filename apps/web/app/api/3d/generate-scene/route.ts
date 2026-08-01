import { NextRequest, NextResponse } from "next/server";
import { generateScene } from "@/lib/scene/generateScene";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { prompt, mode, meshQuality, polyCount, textureRes } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Prompt is required" } },
        { status: 400 },
      );
    }

    const scene = generateScene(prompt, {
      meshQuality,
      polyCount,
      textureRes,
    });

    return NextResponse.json({ ok: true, scene, mode: mode ?? "text" });
  } catch (error: any) {
    logger.error("3D scene generation error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "GENERATION_FAILED", message: error?.message ?? "Failed to generate scene" } },
      { status: 500 },
    );
  }
}
