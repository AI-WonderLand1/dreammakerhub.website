import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

const DATA_ROOT = path.join(process.cwd(), ".data", "projects");

function projectPath(projectId: string) {
  return path.join(DATA_ROOT, projectId);
}

async function readMetadata(projectId: string) {
  const metaPath = path.join(projectPath(projectId), "metadata.json");
  const raw = await fs.readFile(metaPath, "utf8");
  return JSON.parse(raw) as { ownerId: string };
}

async function assertOwner(projectId: string, ownerId: string) {
  const meta = await readMetadata(projectId);
  if (meta.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }
  return meta;
}

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { projectId: string; assetId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await assertOwner(params.projectId, smokeUserId ?? user!.id);
    const assetsDir = path.join(projectPath(params.projectId), "files", "assets");
    const files = await fs.readdir(assetsDir);
    const match = files.find((f) => f.startsWith(params.assetId + "-"));
    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const filePath = path.join(assetsDir, match);
    const data = await fs.readFile(filePath);
    const mime =
      match.endsWith(".png")
        ? "image/png"
        : match.endsWith(".jpg") || match.endsWith(".jpeg")
        ? "image/jpeg"
        : match.endsWith(".webp")
        ? "image/webp"
        : match.endsWith(".svg")
        ? "image/svg+xml"
        : match.endsWith(".mp4")
        ? "video/mp4"
        : match.endsWith(".webm")
        ? "video/webm"
        : "application/octet-stream";
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    const code = error?.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: "Failed to load asset" }, { status: code });
  }
}
