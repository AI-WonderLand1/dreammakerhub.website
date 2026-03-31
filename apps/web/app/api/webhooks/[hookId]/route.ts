import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";
import { deleteHook, updateHookActive } from "@/lib/webhooks/store";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { hookId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  const ownerId = smokeUserId ?? user?.id;
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await deleteHook(ownerId, params.hookId);
  return NextResponse.json({ ok });
}

export async function PATCH(req: NextRequest, { params }: { params: { hookId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  const ownerId = smokeUserId ?? user?.id;
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const active = Boolean(body?.active);

  const hook = await updateHookActive(ownerId, params.hookId, active);
  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    hook: {
      id: hook.id,
      url: hook.url,
      events: hook.events,
      active: hook.active,
      createdAt: hook.createdAt,
      updatedAt: hook.updatedAt,
    },
  });
}
