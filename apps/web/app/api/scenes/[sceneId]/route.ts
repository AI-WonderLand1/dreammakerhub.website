import { NextResponse } from "next/server";
import { loadSceneFromSupabase } from "@/lib/scene/supabase-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { sceneId: string } }
) {
  try {
    const { sceneId } = params;

    // Try to load from Supabase
    const scene = await loadSceneFromSupabase(sceneId);

    if (!scene) {
      return NextResponse.json(
        { error: "Scene not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(scene);

  } catch (error: any) {
    console.error("Load scene error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load scene" },
      { status: 500 }
    );
  }
}