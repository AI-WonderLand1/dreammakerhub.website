import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";
<<<<<<< HEAD
=======
import { ssrfFetch, SsrfError } from "@/lib/ssrf-safe-fetch.node";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

const OPTIMIZER_URL = process.env.OPTIMIZER_SERVICE_URL || "http://localhost:3090";

interface ProcessRequest {
  assetUrl?: string;
  assetId?: string;
  fileName?: string;
}

const ALLOWED_ASSET_HOSTS = [
  "playcanvas.com",
  "cdn.playcanvas.com",
  "sketchfab.com",
  "media.sketchfab.com",
  "polyhaven.com",
  "dl.polyhaven.org",
  "github.com",
  "raw.githubusercontent.com",
  "supabase.co",
] as const;

<<<<<<< HEAD
function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Check localhost variants
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0") {
    return true;
  }

  // Block IPv6 loopback and private ranges
  if (host.startsWith("[::") || host.startsWith("::ffff:")) {
    return true;
  }

  // Block direct IPv4 private/link-local/loopback ranges.
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
      return true;
    }

    const [a, b, c, d] = octets;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (shared address space)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 198.18.0.0/15 (benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;
  }

  return false;
}

function validateAssetUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("assetUrl must be a valid absolute URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("assetUrl must use https protocol");
  }

  if (parsed.username || parsed.password) {
    throw new Error("assetUrl must not include URL credentials");
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    throw new Error("assetUrl targets a disallowed host");
  }

  const isAllowedHost = ALLOWED_ASSET_HOSTS.some(
    allowed => parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowedHost) {
    throw new Error("assetUrl host is not in the allowed list");
  }

  return parsed.toString();
}

=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProcessRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { assetUrl, assetId, fileName } = body;

  if (!assetUrl && !assetId) {
    return NextResponse.json(
      { error: "Missing required field: assetUrl or assetId" },
      { status: 400 }
    );
  }

  try {
    let glbBuffer: ArrayBuffer;

    if (assetUrl) {
<<<<<<< HEAD
      const safeAssetUrl = validateAssetUrl(assetUrl);
      const response = await fetch(safeAssetUrl, { redirect: "manual" });
=======
      const response = await ssrfFetch(assetUrl, { allowedHosts: ALLOWED_ASSET_HOSTS });
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
      if (!response.ok) {
        if (response.status >= 300 && response.status < 400) {
          return NextResponse.json(
            { error: "Redirects are not allowed" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `Failed to fetch asset: ${response.status}` },
          { status: response.status }
        );
      }
      glbBuffer = await response.arrayBuffer();
    } else if (assetId) {
      const { data: asset, error: assetError } = await supabase
        .from("user_assets")
        .select("local_url")
        .eq("asset_id", assetId)
        .maybeSingle();

      if (assetError) {
        return NextResponse.json({ error: "Failed to fetch asset", details: assetError.message }, { status: 500 });
      }

      if (!asset?.local_url) {
        return NextResponse.json(
          { error: "Asset not found" },
          { status: 404 }
        );
      }

<<<<<<< HEAD
      const response = await fetch(asset.local_url);
=======
      const response = await ssrfFetch(asset.local_url);
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch asset: ${response.status}` },
          { status: response.status }
        );
      }
      glbBuffer = await response.arrayBuffer();
    } else {
      return NextResponse.json(
        { error: "No asset URL or ID provided" },
        { status: 400 }
      );
    }

    const optimizeResponse = await fetch(`${OPTIMIZER_URL}/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: glbBuffer,
    });

    if (!optimizeResponse.ok) {
      const errorText = await optimizeResponse.text();
      console.error("Optimizer error:", optimizeResponse.status, errorText);
      return NextResponse.json(
        { error: "Optimization failed", details: errorText },
        { status: optimizeResponse.status }
      );
    }

    const optimizedBuffer = await optimizeResponse.arrayBuffer();
    const fileNameSafe = fileName || `optimized-${Date.now()}.glb`;
    const userId = session.user.id;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("3d-assets")
      .upload(`meshes/${userId}/${fileNameSafe}`, optimizedBuffer, {
        contentType: "model/gltf-binary",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to save optimized asset", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("3d-assets")
      .getPublicUrl(`meshes/${userId}/${fileNameSafe}`);

    const savings = glbBuffer.byteLength > 0 
      ? Math.round((1 - optimizedBuffer.byteLength / glbBuffer.byteLength) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      originalUrl: assetUrl || null,
      optimizedUrl: publicUrl,
      originalSize: glbBuffer.byteLength,
      optimizedSize: optimizedBuffer.byteLength,
      savings: savings + "%",
    });
  } catch (error) {
    console.error("Asset processing error:", error);
    return NextResponse.json(
      { error: "Failed to process asset" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${OPTIMIZER_URL}/health`);
    return NextResponse.json({
      optimizerAvailable: response.ok,
      url,
    });
  } catch (error) {
    return NextResponse.json({
      optimizerAvailable: false,
      url,
      error: "Optimizer service not reachable",
    });
  }
}