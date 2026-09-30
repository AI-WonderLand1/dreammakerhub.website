// Compatibility route: all key creation/listing uses one implementation.
export { GET, POST } from "../route";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { revokeWonderlandKey } from "@/lib/wonderland-api-keys/server";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "Valid key ID required" }, { status: 400 });
  }
  try {
    const revoked = await revokeWonderlandKey(userId, body.id);
    return revoked
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Key not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Key revocation unavailable" }, { status: 503 });
  }
}
