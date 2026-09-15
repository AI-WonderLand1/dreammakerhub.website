import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const BUCKET_NAME = "3d-assets";

function getPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!supabaseUrl || !publicKey) return null;
  return createClient(supabaseUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ files: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    // This endpoint is a public scene catalog. Use only the public Supabase
    // credential so storage policies remain the authorization boundary; never
    // expose a service-role-backed directory listing to anonymous callers.
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" }
      });

    if (error) {
      logger.error("Supabase storage error:", { message: error.message });
      return NextResponse.json({ files: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const sceneFiles = files?.filter((file) =>
      file.name.endsWith(".json") || file.name.endsWith(".scene")
    ) || [];

    const scenes = await Promise.all(
      sceneFiles.map(async (file) => {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name);

        try {
          const response = await fetch(publicUrl, { cache: "no-store" });
          if (!response.ok) throw new Error("Scene metadata unavailable");
          const sceneData = await response.json();

          return {
            id: file.name.replace(/\.(json|scene)$/, ""),
            name: typeof sceneData?.name === "string" ? sceneData.name : file.name,
            description: typeof sceneData?.description === "string" ? sceneData.description : "3D Scene",
            category: typeof sceneData?.category === "string" ? sceneData.category : "custom",
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

    return NextResponse.json({ files: scenes }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error: unknown) {
    logger.error("Failed to list 3D assets:", error);
    return NextResponse.json({ files: [] }, { status: 500 });
  }
}
