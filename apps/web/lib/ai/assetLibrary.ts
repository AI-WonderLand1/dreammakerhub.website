import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ExternalAsset {
  id: string;
  name: string;
  source: "playcanvas" | "sketchfab" | "poly-haven" | "local";
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  format: "glb" | "gltf" | "fbx";
  category: string;
  tags: string[];
  author?: string;
  license?: string;
}

export interface AssetFetchRequest {
  query?: string;
  category?: string;
  source?: "playcanvas" | "sketchfab" | "poly-haven" | "all";
  limit?: number;
}

const SKETCHFAB_API = "https://api.sketchfab.com/v3";

async function fetchOpenSource3DAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const projectsRes = await fetch("https://raw.githubusercontent.com/ToxSam/open-source-3d-assets/main/data/projects.json");
    const projectsData = await projectsRes.json();

    const filtered = projectsData
      .filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase()) || p.tags?.some((t: string) => t.toLowerCase().includes(query.toLowerCase())))
      .slice(0, limit);

    for (const project of filtered) {
      assets.push({
        id: `ossa_${project.slug}`,
        name: project.name,
        source: "local",
        url: project.download || project.repo,
        thumbnailUrl: project.preview || "",
        downloadUrl: project.download || "",
        format: "glb",
        category: project.category || "model",
        tags: project.tags || [],
        author: project.author || "Open Source",
        license: project.license || "CC0"
      });
    }
  } catch (err) {
    console.error("Open Source 3D Assets fetch error:", err);
  }

  return assets;
}

async function fetchPolyHavenAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const res = await fetch(`https://3dmodelhaven.com/files/models?search=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await res.json();

    if (data) {
      const items = Array.isArray(data) ? data : data.files || [];
      for (const item of items) {
        assets.push({
          id: `ph_${item.id || item.model_id}`,
          name: item.model_name || item.name,
          source: "poly-haven",
          url: `https://3dmodelhaven.com/mod/${item.model_id || item.id}`,
          thumbnailUrl: item.preview_url || item.thumbnail || `https://3dmodelhaven.com/tex/thumbs/${item.model_id || item.id}_100_100.jpg`,
          downloadUrl: item.download || "",
          format: "glb",
          category: item.category || "model",
          tags: item.tags || [],
          author: item.author,
          license: "CC0"
        });
      }
    }
  } catch (err) {
    console.error("Poly Haven fetch error:", err);
  }

  return assets;
}

async function fetchSketchfabAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const searchUrl = `${SKETCHFAB_API}/search/models?q=${encodeURIComponent(query)}&downloadable=true&animated=false&limit=${limit}`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    if (data.results) {
      for (const item of data.results) {
        const thumb = item.thumbnails?.images?.[0];
        assets.push({
          id: `sf_${item.uid}`,
          name: item.name,
          source: "sketchfab",
          url: `https://sketchfab.com/models/${item.uid}`,
          thumbnailUrl: thumb?.url || `https://media.sketchfab.com/models/${item.uid}/thumbnails/${item.uid}/c4b430e12dd64be0b6918964b19e9623/b256a6803b2f4e339a2dd56d74236500.jpeg`,
          downloadUrl: item.download?.url || "",
          format: "glb",
          category: item.categories?.[0]?.name || "model",
          tags: item.tags || [],
          author: item.user?.displayName,
          license: item.license?.slug || "CC-BY-NC"
        });
      }
    }
  } catch (err) {
    console.error("Sketchfab fetch error:", err);
  }

  return assets;
}

export async function searchExternalAssets(request: AssetFetchRequest): Promise<ExternalAsset[]> {
  const { query = "3d model", source = "all", limit = 10 } = request;
  const results: ExternalAsset[] = [];

  const sources = source === "all"
    ? ["open-source", "sketchfab", "poly-haven"] as const
    : [source] as const;

  const promises = sources.map(s => {
    switch (s) {
      case "open-source":
        return fetchOpenSource3DAssets(query, limit);
      case "sketchfab":
        return fetchSketchfabAssets(query, limit);
      case "poly-haven":
        return fetchPolyHavenAssets(query, limit);
      default:
        return Promise.resolve([]);
    }
  });

  const resultsArr = await Promise.all(promises);
  for (const r of resultsArr) {
    results.push(...r);
  }

  return results;
}

export async function downloadAssetToStorage(asset: ExternalAsset, userId?: string): Promise<{ success: boolean; localUrl?: string; error?: string }> {
  if (!asset.downloadUrl) {
    return { success: false, error: "No download URL available" };
  }

  try {
    const response = await fetch(asset.downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const fileName = `${asset.id}.${asset.format}`;
    
    const { data, error } = await supabase.storage
      .from("3d-assets")
      .upload(`meshes/${fileName}`, buffer, {
        contentType: `model/${asset.format}`,
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("3d-assets")
      .getPublicUrl(`meshes/${fileName}`);

    if (userId) {
      await supabase.from("user_assets").insert({
        user_id: userId,
        asset_id: asset.id,
        name: asset.name,
        source: asset.source,
        local_url: publicUrl,
        downloaded_at: new Date().toISOString()
      });
    }

    await supabase.from("asset_metadata").insert({
      glb_url: publicUrl,
      format: asset.format,
      version: 1
    });

    return { success: true, localUrl: publicUrl };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Download failed" };
  }
}

export async function listUserAssets(userId: string): Promise<ExternalAsset[]> {
  const { data, error } = await supabase
    .from("user_assets")
    .select("*")
    .eq("user_id", userId)
    .order("downloaded_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.asset_id,
    name: row.name,
    source: row.source as ExternalAsset["source"],
    url: "",
    thumbnailUrl: "",
    downloadUrl: row.local_url,
    format: "glb",
    category: "user",
    tags: []
  }));
}