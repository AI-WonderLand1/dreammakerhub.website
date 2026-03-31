import { NextResponse } from "next/server";
import { listArtifactMetadata } from "./_utils";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const artifacts = await listArtifactMetadata(projectId);
    return NextResponse.json({ artifacts });
  } catch {
    return NextResponse.json({ error: "Failed to list artifacts" }, { status: 500 });
  }
}
