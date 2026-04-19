import { NextResponse } from "next/server";
import { loadSceneFromSupabase } from "@/lib/scene/supabase-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { sceneId } = resolvedParams;
    const url = new URL(request.url);
    const stream = url.searchParams.get("stream") === "true";

    // Use streaming if requested
    if (stream) {
      return NextResponse.redirect(new URL(`/api/scenes/${sceneId}/stream`, request.url));
    }

    // Try to load from local template files FIRST (since Supabase isn't working)
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const templatesDir = '/home/dreammakerhub/htdocs/dreammakerhub.website/psychic-octo-fishstick/templates/3d';
      const templateFile = `${sceneId}.json`;
      const filePath = path.join(templatesDir, templateFile);
      
      console.log('Looking for scene file:', filePath);
      console.log('File exists:', fs.existsSync(filePath));
      
      if (fs.existsSync(filePath)) {
        const sceneData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log('Loaded scene data successfully');
        return NextResponse.json(sceneData);
      }
    } catch (error) {
      console.log("Local template not available:", error.message);
    }
    
    // Fallback to Supabase (will likely fail due to connection issues)
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