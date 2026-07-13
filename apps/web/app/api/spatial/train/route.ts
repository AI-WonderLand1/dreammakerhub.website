import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@/lib/smokeAuth";
import { createJob, updateJobStatus } from "@/lib/spatial/splatJobs";
import type { TrainRequest } from "@/lib/spatial/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);

    if (!user && !smokeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = smokeUserId ?? user!.id;
    const body = await req.json();

    const { projectId, sourceType, sourceAssetUrls, options } = body as {
      projectId: string
      sourceType?: 'photos' | 'video'
      sourceAssetUrls: string[]
      options?: TrainRequest['options']
    };

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (!sourceAssetUrls || sourceAssetUrls.length === 0) {
      return NextResponse.json({ error: "sourceAssetUrls is required" }, { status: 400 });
    }

    // 1. Create the job record
    const job = await createJob(
      projectId,
      userId,
      sourceType || "photos",
      sourceAssetUrls
    );

    // 2. Mark as processing
    await updateJobStatus(job.id, 'processing');

    // 3. Dispatch to training worker
    try {
      await dispatchTraining(job.id, sourceAssetUrls, options);
      await updateJobStatus(job.id, 'training', { progress: 0 });
    } catch (err: any) {
      await updateJobStatus(job.id, 'failed', { error: err.message });
      return NextResponse.json({
        jobId: job.id,
        status: 'failed',
        error: err.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'training',
      message: 'Training job dispatched. Poll /api/spatial/jobs/[jobId] for status.',
    });
  } catch (error: any) {
    console.error("Splat train error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Dispatch training to the backend worker.
 *
 * This is the pluggable integration point. In production this would:
 *   - Call a Kubernetes job on Civo (via Coder workspace or OKE)
 *   - Call an external API (Polycam, Luma, nerfstudio)
 *   - Spawn a local GPU worker process
 *
 * For now it dispatches to a Supabase Edge Function or a webhook endpoint
 * configured via SPLAT_TRAINING_WEBHOOK env var.
 */
async function dispatchTraining(
  jobId: string,
  sourceUrls: string[],
  options?: { format?: string; quality?: string; maxIterations?: number }
): Promise<void> {
  const webhookUrl = process.env.SPLAT_TRAINING_WEBHOOK;

  if (webhookUrl) {
    // External worker — call the webhook
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        sourceUrls,
        format: options?.format ?? "ply",
        quality: options?.quality ?? "medium",
        maxIterations: options?.maxIterations ?? 30000,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/spatial/callback`,
      }),
    });

    if (!res.ok) {
      throw new Error(`Training dispatch failed: ${res.status} ${await res.text()}`);
    }
  } else {
    // No external worker configured — simulate training for development.
    // In production, remove this branch and require SPLAT_TRAINING_WEBHOOK.
    console.warn(
      `[SplatTrain] No SPLAT_TRAINING_WEBHOOK configured. ` +
      `Job ${jobId} created but training will not run. ` +
      `Set SPLAT_TRAINING_WEBHOOK to an endpoint that accepts POST with {jobId, sourceUrls, format, quality}.`
    );
  }
}
