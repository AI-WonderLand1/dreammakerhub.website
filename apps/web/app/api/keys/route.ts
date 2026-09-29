import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { createWonderlandKey, listWonderlandKeys } from "@/lib/wonderland-api-keys/server";

export const runtime = "nodejs";

async function currentUser() {
  const db = await supabaseRouteClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ keys: await listWonderlandKeys(user.id) });
  } catch {
    return NextResponse.json({ error: "Key storage unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.name !== "string" || !body.name.trim() || body.name.trim().length > 64) {
    return NextResponse.json({ error: "Key name must be 1-64 characters" }, { status: 400 });
  }
  try {
    const result = await createWonderlandKey(user.id, body.name.trim());
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
