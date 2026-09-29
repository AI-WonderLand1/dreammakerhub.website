import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { revokeWonderlandKey } from "@/lib/wonderland-api-keys/server";

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid key ID" }, { status: 400 });
  }
  const supabase = await supabaseRouteClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const revoked = await revokeWonderlandKey(auth.user.id, id);
    return revoked
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Key not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Key revocation unavailable" }, { status: 503 });
  }
}
