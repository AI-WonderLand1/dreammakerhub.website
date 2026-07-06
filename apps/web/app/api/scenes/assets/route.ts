import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "3d-assets";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ files: [] });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" }
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return NextResponse.json({ files: [], error: error.message });
    }

    // Filter for JSON scene files
    const sceneFiles = files?.filter(f => 
      f.name.endsWith(".json") || f.name.endsWith(".scene")
    ) || [];

    // Get public URLs for each file
    const scenes = await Promise.all(
      sceneFiles.map(async (file) => {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name);

        // Try to fetch the scene data
        try {
          const response = await fetch(publicUrl);
          const sceneData = await response.json();
          
          return {
            id: file.name.replace(/\.(json|scene)$/, ""),
            name: sceneData.name || file.name,
            description: sceneData.description || "3D Scene",
            category: sceneData.category || "custom",
            url: publicUrl
          };
        } catch {
          return {
            id: file.name.replace(/\.(json|scene)$/, ""),
            name: file.name,
            description: "3D Scene",
            category: "custom",
            url: publicUrl
          };
        }
      })
    );

    return NextResponse.json({ files: scenes });

  } catch (error: any) {
    console.error("Failed to list 3D assets:", error);
    return NextResponse.json({ files: [], error: error.message }, { status: 500 });
  }
}