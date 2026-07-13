import { NextRequest, NextResponse } from "next/server";
import { updateJobStatus } from "@/lib/spatial/splatJobs";

export const runtime = "nodejs";

/**
 * Callback endpoint for the training worker.
 *
 * The training worker POSTs here when training completes or fails.
 * Body: { jobId, status: 'completed' | 'failed', resultUrl?, resultFormat?, error? }
 *
 * In production, protect this endpoint with a shared secret or mTLS.
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: verify callback secret
    const secret = req.headers.get("x-callback-secret");
    if (process.env.SPLAT_CALLBACK_SECRET && secret !== process.env.SPLAT_CALLBACK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, status, resultUrl, resultFormat, error } = body;

    if (!jobId || !status) {
      return NextResponse.json({ error: "jobId and status are required" }, { status: 400 });
    }

    if (status !== "completed" && status !== "failed") {
      return NextResponse.json({ error: "status must be 'completed' or 'failed'" }, { status: 400 });
    }

    const job = await updateJobStatus(jobId, status, {
      resultUrl,
      resultFormat,
      error,
      progress: status === "completed" ? 100 : undefined,
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Splat callback error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
