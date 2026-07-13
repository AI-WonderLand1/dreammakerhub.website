import { NextRequest, NextResponse } from "next/server";
import { getJob, listJobsForProject } from "@/lib/spatial/splatJobs";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Splat job status error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await req.json();

    const { updateJobStatus } = await import("@/lib/spatial/splatJobs");

    const job = await updateJobStatus(jobId, body.status, {
      progress: body.progress,
      resultUrl: body.resultUrl,
      resultFormat: body.resultFormat,
      error: body.error,
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Splat job update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
