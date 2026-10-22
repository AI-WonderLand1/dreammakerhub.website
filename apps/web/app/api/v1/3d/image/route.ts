import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { CostGateError, reserveBillableUnits, verifiedCostPlan } from "@/lib/billing/cost-guard.server";
import { PLAN_LIMITS } from "@/lib/billing/limits";
import { getSavedGeneratedGlb, saveGeneratedGlb } from "@/lib/3d/generated-asset-store";
import {
  downloadSimpleRickGlb, signSimpleRickJob, simpleRickJobStatus,
  SimpleRickError, submitSimpleRickImage, verifySimpleRickJob,
} from "@/lib/3d/simplerick-client";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof CostGateError) {
    return NextResponse.json({ ok: false, error: { message: error.message } }, { status: error.status });
  }
  if (error instanceof SimpleRickError) {
    return NextResponse.json({ ok: false, error: { message: error.message } }, { status: error.status });
  }
  logger.error("SimpleRick image-to-3D failed", error);
  return NextResponse.json({ ok: false, error: { message: "Image-to-3D is temporarily unavailable" } }, { status: 500 });
}

/** Browser image upload; server authenticates, meters credits and forwards to Vultr. */
export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const length = Number(req.headers.get("content-length") || 0);
    if (length > 9 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: { message: "Image must be under 8 MB" } }, { status: 413 });
    }
    const form = await req.formData();
    const image = form.get("image");
    const projectId = String(form.get("projectId") || "").trim() || null;
    const label = String(form.get("label") || "").trim().slice(0, 160) || "Image-to-3D asset";
    if (!(image instanceof File) || !image.size || image.size > 8 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(image.type)) {
      return NextResponse.json({ ok: false, error: { message: "Upload a PNG, JPEG or WebP under 8 MB" } }, { status: 400 });
    }
    if (projectId && !/^[a-zA-Z0-9_-]{1,120}$/.test(projectId)) {
      return NextResponse.json({ ok: false, error: { message: "Invalid project ID" } }, { status: 400 });
    }

    const plan = await verifiedCostPlan(auth.userId);
    await reserveBillableUnits(auth.userId, "render_credits", 1, PLAN_LIMITS[plan].renderCreditsMonthly);
    const jobId = await submitSimpleRickImage(image);
    const ticket = signSimpleRickJob({ jobId, userId: auth.userId, projectId, label });
    return NextResponse.json({ ok: true, status: "queued", progress: 5, ticket }, {
      status: 202, headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}

/** Polls a user-bound signed job ticket; completed GLBs are saved once in private storage. */
export async function GET(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const ticket = verifySimpleRickJob(req.nextUrl.searchParams.get("ticket") || "", auth.userId);
    const status = await simpleRickJobStatus(ticket.jobId);
    if (status.state === "failed") {
      return NextResponse.json({ ok: false, error: { message: status.error || "GPU rendering failed" } }, { status: 502 });
    }
    if (status.state !== "complete") {
      return NextResponse.json({ ok: true, status: status.state, progress: status.progress }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    let stored = await getSavedGeneratedGlb({ userId: auth.userId, projectId: ticket.projectId, id: ticket.assetId });
    if (!stored) {
      const glb = await downloadSimpleRickGlb(ticket.jobId);
      try {
        stored = await saveGeneratedGlb({
          userId: auth.userId, projectId: ticket.projectId, id: ticket.assetId,
          prompt: ticket.label, glb, provider: "SimpleRick TRELLIS",
        });
        await logUsage({ userId: auth.userId, projectId: ticket.projectId, action: "3d.generation", apiCalls: 1, threeDGenerations: 1 });
      } catch (uploadError) {
        // A simultaneous poll may already have uploaded this deterministic asset ID.
        stored = await getSavedGeneratedGlb({ userId: auth.userId, projectId: ticket.projectId, id: ticket.assetId });
        if (!stored) throw uploadError;
      }
    }
    return NextResponse.json({
      ok: true, status: "complete", progress: 100,
      asset: { id: ticket.assetId, format: "glb", url: stored.signedUrl, storagePath: stored.path, urlExpiresIn: stored.expiresIn },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return failure(error);
  }
}
