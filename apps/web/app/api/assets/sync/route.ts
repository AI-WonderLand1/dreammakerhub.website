import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category = "all" } = body;

    const results: { source: string; synced: number; errors: number }[] = [];

    if (category === "all" || category === "sketchfab") {
      const res = await fetch(
        `https://api.sketchfab.com/v3/search/models?downloadable=true&license=cc&sort_by=-likeCount&limit=50`
      );
      const data = await res.json();
      let synced = 0, errors = 0;

      for (const item of data.results || []) {
        const thumb = item.thumbnails?.images?.[0];
        try {
          await supabase.from("assets").upsert({
            id: `sf_${item.uid}`,
            name: item.name,
            source: "sketchfab",
            url: `https://sketchfab.com/models/${item.uid}`,
            thumbnail_url: thumb?.url || "",
            download_url: item.download?.url || "",
            format: "glb",
            category: item.categories?.[0]?.name || "model",
            tags: item.tags || [],
            author: item.user?.displayName,
            license: item.license?.slug || "CC-BY-NC"
          }, { onConflict: "id" });
          synced++;
        } catch { errors++; }
      }
      results.push({ source: "sketchfab", synced, errors });
    }

    if (category === "all" || category === "poly-haven") {
      const categories = ["props", "characters", "architecture"];
      let synced = 0, errors = 0;

      for (const cat of categories) {
        try {
          const res = await fetch(`https://3dmodelhaven.com/files/models?category=${cat}&limit=30`);
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.files || [];

          for (const item of items) {
            try {
              await supabase.from("assets").upsert({
                id: `ph_${item.id || item.model_id}`,
                name: item.model_name || item.name,
                source: "poly-haven",
                url: `https://3dmodelhaven.com/mod/${item.model_id || item.id}`,
                thumbnail_url: `https://3dmodelhaven.com/tex/thumbs/${item.model_id || item.id}_256_256.jpg`,
                download_url: item.download || "",
                format: "glb",
                category: cat,
                tags: [],
                author: item.author,
                license: "CC0"
              }, { onConflict: "id" });
              synced++;
            } catch { errors++; }
          }
        } catch { errors++; }
      }
      results.push({ source: "poly-haven", synced, errors });
    }

    if (category === "all" || category === "open-source") {
      let synced = 0, errors = 0;
      try {
        const res = await fetch("https://raw.githubusercontent.com/ToxSam/open-source-3d-assets/main/data/projects.json");
        const projects = await res.json();

        for (const project of projects.slice(0, 100)) {
          try {
            await supabase.from("assets").upsert({
              id: `ossa_${project.slug}`,
              name: project.name,
              source: "open-source",
              url: project.repo || project.download,
              thumbnail_url: project.preview || "",
              download_url: project.download || "",
              format: "glb",
              category: project.category || "model",
              tags: project.tags || [],
              author: project.author,
              license: project.license || "CC0"
            }, { onConflict: "id" });
            synced++;
          } catch { errors++; }
        }
      } catch { errors++; }
      results.push({ source: "open-source", synced, errors });
    }

    return NextResponse.json({ 
      success: true, 
      results,
      totalSynced: results.reduce((sum, r) => sum + r.synced, 0)
    });
  } catch (error: any) {
    console.error("Asset sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}