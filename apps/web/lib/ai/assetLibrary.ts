import { createClient } from "@supabase/supabase-js";
import { ssrfFetch, SsrfError } from "@/lib/ssrf-safe-fetch";
import { logger } from '@/lib/logger';

let _client: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) _client = createClient(url, key);
  }
  return _client;
}

const ALLOWED_DOWNLOAD_HOSTS = [
  "playcanvas.com",
  "cdn.playcanvas.com",
  "sketchfab.com",
  "media.sketchfab.com",
  "polyhaven.com",
  "dl.polyhaven.org",
] as const;

const SOURCE_ALLOWED_HOSTS: Record<string, readonly string[]> = {
  playcanvas: ["playcanvas.com", "cdn.playcanvas.com"],
  sketchfab: ["sketchfab.com", "media.sketchfab.com"],
  "poly-haven": ["polyhaven.com", "dl.polyhaven.org"],
  free3d: [],
  user: [],
};

function isAllowedHostForSource(source: ExternalAsset["source"], hostname: string): boolean {
  const allowedHosts = SOURCE_ALLOWED_HOSTS[source] ?? [];
  return allowedHosts.some(allowed => hostname === allowed);
}

function getSafeOptimizerUrl(): string {
  const optimizerUrl = process.env.OPTIMIZER_URL;

  if (!optimizerUrl) {
    return "/api/assets/process";
  }

  let parsed: URL;
  try {
    parsed = new URL(optimizerUrl);
  } catch {
    throw new Error("Invalid optimizer URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Unsupported optimizer URL protocol");
  }

  if (parsed.hostname !== "localhost") {
    throw new Error("Optimizer URL host is not allowed");
  }

  return parsed.toString();
}

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
    logger.error("Open Source 3D Assets fetch error:", err);
  }

  return assets;
}

async function fetchPolyHavenAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const res = await fetch(`https://api.polyhaven.com/assets?type=models&search=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await res.json();

    if (data && data.results) {
      for (const [id, item] of Object.entries(data.results)) {
        const typedItem = item as any;
        assets.push({
          id: `ph_${id}`,
          name: typedItem.name || id,
          source: "poly-haven",
          url: `https://polyhaven.com/a/${id}`,
          thumbnailUrl: typedItem.thumbnail?.url || `https://api.polyhaven.com/files/${id}/thumbnail?width=256`,
          downloadUrl: `https://api.polyhaven.com/files/${id}/blend`,
          format: "glb",
          category: typedItem.category || "model",
          tags: typedItem.tags || [],
          author: "Poly Haven",
          license: "CC0"
        });
      }
    }
  } catch (err) {
    logger.error("Poly Haven fetch error:", err);
  }

  return assets;
}

async function fetchSketchfabAssets(query: string, limit = 10): Promise<ExternalAsset[]> {
  const assets: ExternalAsset[] = [];

  try {
    const searchUrl = `${SKETCHFAB_API}/search/models?q=${encodeURIComponent(query)}&downloadable=true&animated=false&limit=${limit}`;
    const headers: Record<string, string> = {};
    const token = process.env.SKETCHFAB_API_TOKEN || "";
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }
    const res = await fetch(searchUrl, { headers });
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
    logger.error("Sketchfab fetch error:", err);
  }

  return assets;
}

export async function searchExternalAssets(request: AssetFetchRequest): Promise<ExternalAsset[]> {
  const { query = "3d model", source = "all", limit = 10 } = request;
  const results: ExternalAsset[] = [];

  const { data: dbAssets } = await sb()!
    .from("assets")
    .select("*")
    .or(`name.ilike.%${query}%,tags.cs.{${query}}`)
    .limit(limit * 2);

  if (dbAssets && dbAssets.length > 0) {
    results.push(...dbAssets.map(row => ({
      id: row.id,
      name: row.name,
      source: row.source as ExternalAsset["source"],
      url: row.url || "",
      thumbnailUrl: row.thumbnail_url || "",
      downloadUrl: row.download_url || "",
      format: (row.format as ExternalAsset["format"]) || "glb",
      category: row.category || "model",
      tags: row.tags || [],
      author: row.author,
      license: row.license
    })))
  }

  if (results.length < limit) {
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
  }

  return results.slice(0, limit);
}

export async function downloadAssetToStorage(asset: ExternalAsset, userId?: string): Promise<{ success: boolean; localUrl?: string; error?: string }> {
  if (!asset.downloadUrl) {
    return { success: false, error: "No download URL available" };
  }

  try {
    const parsedUrl = new URL(asset.downloadUrl);
    if (!isAllowedHostForSource(asset.source, parsedUrl.hostname.toLowerCase())) {
      throw new Error("Download URL host does not match asset source");
    }

    const response = await ssrfFetch(asset.downloadUrl, {
      allowedHosts: ALLOWED_DOWNLOAD_HOSTS,
    });
    if (!response.ok) {
      if (response.status >= 300 && response.status < 400) {
        throw new Error("Redirects are not allowed for asset downloads");
      }
      throw new Error(`Download failed: ${response.status}`);
    }

    const originalBuffer = await response.arrayBuffer();
    let finalBuffer = new Uint8Array(originalBuffer);
    const fileName = `${asset.id}.${asset.format}`;
    
    const optimizerUrl = getSafeOptimizerUrl();

    try {
      const optimizeRes = await fetch(optimizerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetUrl: asset.downloadUrl, fileName }),
      });

      if (optimizeRes.ok) {
        const optimizeData = await optimizeRes.json();
        if (optimizeData.optimizedUrl) {
          const optResp = await ssrfFetch(optimizeData.optimizedUrl, {
            allowedHosts: ALLOWED_DOWNLOAD_HOSTS,
          });
          finalBuffer = new Uint8Array(await optResp.arrayBuffer());
          logger.debug(`[perf] Asset optimized, saved ${optimizeData.savings}`);
        }
      } else {
        logger.warn("[optimizer] Using unoptimized asset");
      }
    } catch (optErr) {
      logger.warn("[optimizer] Skipping optimization, using original:", optErr instanceof Error ? optErr.message : optErr);
    }

    const { data, error } = await sb()!.storage
      .from("3d-assets")
      .upload(`meshes/${fileName}`, finalBuffer, {
        contentType: `model/${asset.format}`,
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = sb()!.storage
      .from("3d-assets")
      .getPublicUrl(`meshes/${fileName}`);

    if (userId) {
      await sb()!.from("user_assets").insert({
        user_id: userId,
        asset_id: asset.id,
        name: asset.name,
        source: asset.source,
        local_url: publicUrl,
        downloaded_at: new Date().toISOString()
      });
    }

    await sb()!.from("asset_metadata").insert({
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
  const { data, error } = await sb()!
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