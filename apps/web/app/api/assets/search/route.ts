import { NextRequest, NextResponse } from "next/server";
import { searchExternalAssets, downloadAssetToStorage } from "@/lib/ai/assetLibrary";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "3d model";
    const source = searchParams.get("source") as "playcanvas" | "sketchfab" | "poly-haven" | "all" || "all";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const assets = await searchExternalAssets({ query, source, limit });

    return NextResponse.json({ assets });
  } catch (error: any) {
    console.error("Asset search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, userId } = body;

    if (!asset?.downloadUrl) {
      return NextResponse.json(
        { error: "Asset or download URL missing" },
        { status: 400 }
      );
    }

    const result = await downloadAssetToStorage(asset, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Download failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, localUrl: result.localUrl });
  } catch (error: any) {
    console.error("Asset download error:", error);
    return NextResponse.json(
      { error: error.message || "Download failed" },
      { status: 500 }
    );
  }
}