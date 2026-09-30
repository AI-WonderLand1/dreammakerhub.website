import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createWonderlandKey, listWonderlandKeys } from "@/lib/wonderland-api-keys/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ keys: await listWonderlandKeys(userId) });
  } catch {
    return NextResponse.json({ error: "Key storage unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.name !== "string" || !body.name.trim() || body.name.trim().length > 64) {
    return NextResponse.json({ error: "Key name must be 1-64 characters" }, { status: 400 });
  }
  try {
    const result = await createWonderlandKey(userId, body.name.trim());
    if ("limitReached" in result) {
      return NextResponse.json({ error: "Maximum five active keys per account" }, { status: 429 });
    }
    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Key creation unavailable" }, { status: 503 });
  }
}
