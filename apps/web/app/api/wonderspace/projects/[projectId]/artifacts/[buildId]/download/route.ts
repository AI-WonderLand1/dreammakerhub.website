import { NextResponse } from "next/server";
import { readArtifactZip } from "../../_utils";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string; buildId: string }> }) {
  try {
    const { projectId, buildId } = await params;
    const data = await readArtifactZip(projectId, buildId);

    if (!data) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename=\"${buildId}.zip\"`,
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to download artifact" }, { status: 500 });
  }
}
