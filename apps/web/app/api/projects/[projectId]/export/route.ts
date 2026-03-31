import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { listFiles, readFile } from "@lib/projects/storage";
import { logger } from "@lib/logger";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);

  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.projectId;

  try {
    const files = await listFiles(projectId, smokeUserId ?? user!.id);
    const zip = new (require('jszip'))();

    for (const file of files) {
      const content = await readFile(projectId, smokeUserId ?? user!.id, file);
      if (content) {
        zip.file(file, content);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="project-${projectId}.zip"`,
      },
    });
  } catch (error: any) {
    logger.error("Export project failed", { error });
    return NextResponse.json({ error: "Failed to export project" }, { status: 500 });
  }
}
