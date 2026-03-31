import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

const DATA_ROOT = path.join(process.cwd(), ".data", "projects");
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
]);

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

async function ensureAssetDir(projectId: string) {
  const dir = path.join(projectPath(projectId), "files", "assets");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await assertOwner(params.projectId, smokeUserId ?? user!.id);
    const dir = await ensureAssetDir(params.projectId);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const assets = await Promise.all(
      entries
        .filter((e) => e.isFile())
        .map(async (entry) => {
          const full = path.join(dir, entry.name);
          const stat = await fs.stat(full);
          const [id, ...rest] = entry.name.split("-");
          const filename = rest.join("-");
          const mime =
            entry.name.endsWith(".png")
              ? "image/png"
              : entry.name.endsWith(".jpg") || entry.name.endsWith(".jpeg")
              ? "image/jpeg"
              : entry.name.endsWith(".webp")
              ? "image/webp"
              : entry.name.endsWith(".svg")
              ? "image/svg+xml"
              : entry.name.endsWith(".mp4")
              ? "video/mp4"
              : entry.name.endsWith(".webm")
              ? "video/webm"
              : "application/octet-stream";
          return {
            id,
            filename,
            mime,
            size: stat.size,
            url: `/api/projects/${params.projectId}/assets/${id}`,
          };
        })
    );
    return NextResponse.json({ ok: true, assets });
  } catch (error: any) {
    const code = error?.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: "Failed to list assets" }, { status: code });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await assertOwner(params.projectId, smokeUserId ?? user!.id);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    const assetId = randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const dir = await ensureAssetDir(params.projectId);
    const target = path.join(dir, `${assetId}-${sanitizedName}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(target, buffer);

    return NextResponse.json({
      ok: true,
      asset: {
        id: assetId,
        filename: sanitizedName,
        mime: file.type,
        size: buffer.length,
        url: `/api/projects/${params.projectId}/assets/${assetId}`,
      },
    });
  } catch (error: any) {
    const code = error?.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: "Failed to upload asset" }, { status: code });
  }
}
