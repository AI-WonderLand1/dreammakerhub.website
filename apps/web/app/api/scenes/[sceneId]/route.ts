import { NextResponse } from "next/server";
import { loadSceneFromSupabase } from "@/lib/scene/supabase-store";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const SCENE_ID_RE = /^[a-zA-Z0-9_-]{1,120}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    if (!SCENE_ID_RE.test(sceneId || "")) {
      return NextResponse.json({ error: "Invalid sceneId" }, { status: 400 });
    }

    const url = new URL(request.url);
    const stream = url.searchParams.get("stream") === "true";

    if (stream) {
      return NextResponse.redirect(new URL(`/api/scenes/${encodeURIComponent(sceneId)}/stream`, request.url));
    }

    // Local templates are restricted to a simple identifier. Never allow user
    // input containing path separators or traversal segments to reach fs paths.
    try {
      const fs = await import('fs');
      const path = await import('path');

      const templatesDir = path.resolve(process.cwd(), 'templates/3d');
      const filePath = path.resolve(templatesDir, `${sceneId}.json`);
      if (!filePath.startsWith(`${templatesDir}${path.sep}`)) {
        return NextResponse.json({ error: "Invalid sceneId" }, { status: 400 });
      }

      if (fs.existsSync(filePath)) {
        const sceneData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return NextResponse.json(sceneData, {
          headers: { "Cache-Control": "public, max-age=60" },
        });
      }
    } catch (error: unknown) {
      logger.info("Local template not available:", error);
    }

    const scene = await loadSceneFromSupabase(sceneId);
    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json(scene, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    logger.error("Load scene error:", error);
    return NextResponse.json({ error: "Failed to load scene" }, { status: 500 });
  }
}
