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

const PLAYCANVAS_API = process.env.PLAYCANVAS_API_URL || "https://api.playcanvas.com";
const PLAYCANVAS_STORE_URL = "https://store.playcanvas.com";
const SKETCHFAB_API = "https://api.sketchfab.com/v3";

async function fetchPlayCanvasAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const searchUrl = `${PLAYCANVAS_STORE_URL}/api/explore/search?q=${encodeURIComponent(query)}&type=models&limit=${limit}`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    if (data.results) {
      for (const item of data.results) {
        assets.push({
          id: `pc_${item.id}`,
          name: item.name || item.title,
          source: "playcanvas",
          url: item.url || `${PLAYCANVAS_STORE_URL}/model/${item.id}`,
          thumbnailUrl: item.thumbnails?.images?.[0]?.url || item.thumbnail?.url || "",
          downloadUrl: item.download?.url || item.gltfUrl || "",
          format: "glb",
          category: item.category || "model",
          tags: item.tags || [],
          author: item.author?.name,
          license: item.license || "CC-BY"
        });
      }
    }
  } catch (err) {
    console.error("PlayCanvas fetch error:", err);
  }

  return assets;
}

async function fetchSketchfabAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const searchUrl = `${SKETCHFAB_API}/search/models?q=${encodeURIComponent(query)}&downloadable=true&animated=false&limit=${limit}`;
    const res = await fetch(searchUrl, {
      headers: {
        "Authorization": `Token ${process.env.SKETCHFAB_TOKEN || ""}`
      }
    });
    const data = await res.json();

    if (data.results) {
      for (const item of data.results) {
        const thumb = item.thumbnails?.images?.[0];
        assets.push({
          id: `sf_${item.uid}`,
          name: item.name,
          source: "sketchfab",
          url: `https://sketchfab.com/models/${item.uid}`,
          thumbnailUrl: thumb?.url || "",
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

async function fetchPolyHavenAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const res = await fetch(`https://polyhaven.com/api/assets?search=${encodeURIComponent(query)}&tglb=1&limit=${limit}`);
    const data = await res.json();

    if (data) {
      for (const [id, item] of Object.entries(data as Record<string, any>)) {
        assets.push({
          id: `ph_${id}`,
          name: item.title || id,
          source: "poly-haven",
          url: `https://polyhaven.com/a/${id}`,
          thumbnailUrl: item.images?.[0] || "",
          downloadUrl: item.formats?.glb?.self || "",
          format: "glb",
          category: item.category || "model",
          tags: item.tags || [],
          author: item.authors?.[0]?.name,
          license: "CC-BY"
        });
      }
    }
  } catch (err) {
    console.error("Poly Haven fetch error:", err);
  }

  return assets;
}

export async function searchExternalAssets(request: AssetFetchRequest): Promise<ExternalAsset[]> {
  const { query = "3d model", source = "all", limit = 10 } = request;
  const results: ExternalAsset[] = [];

  const sources = source === "all"
    ? ["playcanvas", "sketchfab", "poly-haven"] as const
    : [source] as const;

  const promises = sources.map(s => {
    switch (s) {
      case "playcanvas":
        return fetchPlayCanvasAssets(query, limit);
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

  return results.slice(0, limit * sources.length);
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