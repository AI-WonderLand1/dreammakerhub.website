import { NextRequest, NextResponse } from "next/server";
import { searchExternalAssets, downloadAssetToStorage } from "@/lib/ai/assetLibrary";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "3d model";
    const source = searchParams.get("source");
    const allowedSources = ["playcanvas", "sketchfab", "poly-haven", "all"] as const;
    const sourceValue = (allowedSources.includes(source as any) ? source : "all") as typeof allowedSources[number];
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const assets = await searchExternalAssets({ query, source: sourceValue, limit });

    return NextResponse.json({ assets });
  } catch (error: any) {
    logger.error("Asset search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { asset } = body;

    const allowedSources = new Set(["playcanvas", "sketchfab", "poly-haven", "free3d", "user"]);
    const allowedFormats = new Set(["glb", "gltf", "fbx", "obj", "usdz"]);

    if (
      !asset?.downloadUrl ||
      typeof asset.downloadUrl !== "string" ||
      typeof asset.id !== "string" ||
      typeof asset.name !== "string" ||
      typeof asset.source !== "string" ||
      !allowedSources.has(asset.source) ||
      typeof asset.format !== "string" ||
      !allowedFormats.has(asset.format.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Invalid asset payload" },
        { status: 400 }
      );
    }

    const sanitizedAsset = {
      ...asset,
      format: asset.format.toLowerCase(),
    };

    const result = await downloadAssetToStorage(sanitizedAsset, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Download failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, localUrl: result.localUrl });
  } catch (error: any) {
    logger.error("Asset download error:", error);
    return NextResponse.json(
      { error: error.message || "Download failed" },
      { status: 500 }
    );
  }
}