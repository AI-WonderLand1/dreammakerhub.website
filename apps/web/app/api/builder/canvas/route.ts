import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infra/lib/supabase/server-client";
import { requireUserId } from "@/lib/auth";
import { getProjectMetadata } from "@/lib/projects/storage";
import { logger } from '@/lib/logger';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

async function authorizeProject(req: NextRequest, projectId: string) {
  const userId = await requireUserId(req);
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }

  try {
    await getProjectMetadata(projectId, userId);
    return { userId } as const;
  } catch {
    return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) } as const;
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId")?.trim();

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const auth = await authorizeProject(req, projectId);
  if ("error" in auth) return auth.error;

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Canvas payload too large" }, { status: 413 });
  }

  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Canvas payload too large" }, { status: 413 });
    }

    const parsed = JSON.parse(raw) as { data?: unknown };
    const canvasData = parsed?.data;
    if (!canvasData || typeof canvasData !== "object" || Array.isArray(canvasData)) {
      return NextResponse.json({ error: "Invalid canvas data" }, { status: 400 });
    }

    const canvas = canvasData as { assets?: unknown; styles?: unknown };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("canvas_states")
      .upsert(
        {
          project_id: projectId,
          elements: canvas.assets || {},
          css: typeof canvas.styles === "string" ? canvas.styles.slice(0, 500_000) : "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    logger.error("Canvas Save Error:", error);
    return NextResponse.json({ error: "Failed to save canvas" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId")?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const auth = await authorizeProject(req, projectId);
  if ("error" in auth) return auth.error;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canvas_states")
    .select("project_id,elements,css,updated_at")
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Failed to load canvas" }, { status: 500 });
  }

  return NextResponse.json({ data: data || {} }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
