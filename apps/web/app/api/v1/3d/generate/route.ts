import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateWonderApiKey } from "@/lib/api-keys/authenticate";
import { requireUserId } from "@/lib/auth";
import {
  generateHunyuanGlb,
  HunyuanConfigurationError,
  HunyuanGenerationError,
} from "@/lib/3d/hunyuan-client";
import { saveGeneratedGlb } from "@/lib/3d/generated-asset-store";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const hasAuthorizationHeader = req.headers.has("authorization");
    const apiPrincipal = hasAuthorizationHeader
      ? await authenticateWonderApiKey(req)
      : null;
    const sessionUserId = hasAuthorizationHeader ? null : await requireUserId(req);
    const userId = apiPrincipal?.userId ?? sessionUserId;

    // Never fall back to cookie auth when an explicit Authorization header was
    // supplied but invalid. This prevents accidental cross-authentication.
    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: hasAuthorizationHeader ? "Invalid API key" : "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();
    const negativePrompt = String(body?.negativePrompt ?? "").trim();
    const addTexture = body?.addTexture === true || body?.add_texture === true;
    const format = String(body?.format ?? "glb").toLowerCase();
    const projectId = body?.projectId ? String(body.projectId).trim() : null;

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Prompt is required" } },
        { status: 400 },
      );
    }
    if (prompt.length > 4000) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Prompt is too long" } },
        { status: 400 },
      );
    }
    if (format !== "glb") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNSUPPORTED_FORMAT",
            message: "The first 3D API version supports GLB only",
          },
        },
        { status: 400 },
      );
    }

    const glb = await generateHunyuanGlb({
      prompt,
      negativePrompt: negativePrompt || undefined,
      addTexture,
    });

    const assetId = `3d_${randomUUID()}`;
    const stored = await saveGeneratedGlb({
      id: assetId,
      userId: userId,
      projectId,
      prompt,
      glb,
    });

    await logUsage({
      userId: userId,
      projectId,
      action: "api.call",
      apiCalls: 1,
    });

    return NextResponse.json({
      ok: true,
      asset: {
        id: assetId,
        format: "glb",
        bytes: glb.byteLength,
        storagePath: stored.path,
        url: stored.signedUrl,
        urlExpiresIn: stored.expiresIn,
      },
    });
  } catch (error) {
    logger.error("3D API generation failed:", error);

    if (error instanceof HunyuanConfigurationError) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "PROVIDER_NOT_CONFIGURED", message: error.message },
        },
        { status: 503 },
      );
    }

    if (error instanceof HunyuanGenerationError) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "GENERATION_FAILED", message: error.message },
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "3D generation failed" },
      },
      { status: 500 },
    );
  }
}
