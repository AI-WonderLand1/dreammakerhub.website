import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@lib/supabase/server-client";
import { ssrfFetch, SsrfError } from "@/lib/ssrf-safe-fetch.node";

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
      const response = await ssrfFetch(assetUrl, { allowedHosts: ALLOWED_ASSET_HOSTS });
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

      const response = await ssrfFetch(asset.local_url);
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