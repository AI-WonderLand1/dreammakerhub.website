// apps/web/app/api/marketplace/install/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Marketplace install route (ship-now stub).
 * - No Mega/Cloud dependencies.
 * - Later you can implement: fetch package from GitHub, extract, install to project, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const packageId = body?.packageId;

    if (!packageId) {
      return NextResponse.json({ ok: false, error: "Missing packageId" }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Marketplace install stubbed (GitHub installer not wired yet).",
        packageId,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
