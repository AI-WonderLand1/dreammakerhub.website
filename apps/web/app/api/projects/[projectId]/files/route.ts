import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { listFiles, readFile, writeFile, deleteFile } from "@lib/projects/storage";
import { logger } from "@lib/logger";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = params.projectId;
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  try {
    if (filePath) {
      const content = await readFile(projectId, smokeUserId ?? user!.id, filePath);
      if (content === null) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ path: filePath, content });
    }
    const files = await listFiles(projectId, smokeUserId ?? user!.id);
    return NextResponse.json({ files });
  } catch (error: any) {
    logger.error("List/read files failed", { error });
    return NextResponse.json({ error: "Failed to load files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = params.projectId;
  const { path: filePath, content } = await req.json();
  if (!filePath || typeof filePath !== "string") {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  try {
    await writeFile(projectId, smokeUserId ?? user!.id, filePath, content ?? "");
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error("Write file failed", { error });
    return NextResponse.json({ error: "Failed to write file" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = params.projectId;
  const { path: filePath } = await req.json();
  if (!filePath || typeof filePath !== "string") {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  try {
    await deleteFile(projectId, smokeUserId ?? user!.id, filePath);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error("Delete file failed", { error });
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
