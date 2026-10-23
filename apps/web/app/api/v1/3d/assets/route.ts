import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { listGeneratedProjectGlbs, listGeneratedUserGlbs, saveProjectSplat } from "@/lib/3d/generated-asset-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Project-specific private GLB assets, listed only from the authenticated
 * user's storage prefix. Returned signed URLs are temporary and must never
 * be saved as permanent scene references.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  const projectId = req.nextUrl.searchParams.get("projectId")?.trim() || "";
  if (projectId && !/^[a-zA-Z0-9_-]{1,120}$/.test(projectId)) {
    return NextResponse.json({ error: "Select a valid project first" }, { status: 400 });
  }

  try {
    const assets = projectId
      ? await listGeneratedProjectGlbs(auth.userId, projectId)
      : await listGeneratedUserGlbs(auth.userId);
    return NextResponse.json({ assets, projectId }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logger.error("Unable to list project 3D assets", error);
    return NextResponse.json({ error: "Project assets are temporarily unavailable" }, { status: 503 });
  }
}

/** Import an existing Gaussian splat into a private project; this does not run an AI model. */
export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;
  if (Number(req.headers.get("content-length") || 0) > 101 * 1024 * 1024) {
    return NextResponse.json({ error: "3D splats must be under 100 MB" }, { status: 413 });
  }
  try {
    const form = await req.formData();
    const projectId = String(form.get("projectId") || "").trim();
    const file = form.get("file");
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(projectId) || !(file instanceof File)) {
      return NextResponse.json({ error: "Select a project and a .sog or Gaussian .ply file" }, { status: 400 });
    }
    const match = /\.(sog|ply)$/i.exec(file.name);
    if (!match || !file.size || file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Only .sog or Gaussian .ply files under 100 MB are supported" }, { status: 400 });
    }
    const format = match[1].toLowerCase() as "sog" | "ply";
    const contents = Buffer.from(await file.arrayBuffer());
    // A SOG is a bundled ZIP. A Gaussian PLY has splat attributes, unlike a point cloud PLY.
    const header = contents.subarray(0, Math.min(contents.length, 32768)).toString("latin1");
    const valid = format === "sog"
      ? contents.length >= 4 && contents.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
      : header.startsWith("ply\n") && header.includes("end_header") && header.includes("property float scale_0") && header.includes("property float f_dc_0");
    if (!valid) {
      return NextResponse.json({ error: "This is not a supported Gaussian splat file" }, { status: 400 });
    }
    const asset = await saveProjectSplat({
      userId: auth.userId, projectId, format,
      name: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120),
      contents,
    });
    return NextResponse.json({ ok: true, asset }, {
      status: 201, headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logger.error("Unable to import project Gaussian splat", error);
    return NextResponse.json({ error: "Could not save this splat" }, { status: 503 });
  }
}
