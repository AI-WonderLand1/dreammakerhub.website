import { NextRequest, NextResponse } from "next/server";
import { getArtifactMetadata } from "../../_utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string; buildId: string }> }) {
  try {
    const { projectId, buildId } = await params;
    const metadata = await getArtifactMetadata(projectId, buildId);
    if (!metadata) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    const url = new URL(metadata.publicPath, request.nextUrl.origin).toString();
    return NextResponse.json({ url, visibility: "public" as const, artifact: metadata });
  } catch {
    return NextResponse.json({ error: "Failed to resolve deployment URL" }, { status: 500 });
  }
}
