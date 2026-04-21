import { NextRequest, NextResponse } from "next/server";
import { listUserAssets } from "@/lib/ai/assetLibrary";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const assets = await listUserAssets(userId);

    return NextResponse.json({ assets });
  } catch (error: any) {
    console.error("User assets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}
