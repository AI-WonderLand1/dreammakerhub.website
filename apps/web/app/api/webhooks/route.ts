import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";
import { createHook, listHooks } from "@/lib/webhooks/store";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "project.created",
  "project.imported",
  "project.exported",
  "file.written",
  "snapshot.created",
]);

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  const ownerId = smokeUserId ?? user?.id;
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hooks = await listHooks(ownerId);

  const safe = hooks.map((h) => ({
    id: h.id,
    url: h.url,
    events: h.events,
    active: h.active,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  }));

  return NextResponse.json({ hooks: safe });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  const ownerId = smokeUserId ?? user?.id;
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const url = String(body?.url ?? "").trim();
  const events = Array.isArray(body?.events) ? body.events.map(String) : [];

  if (!url || !(url.startsWith("https://") || url.startsWith("http://"))) {
    return NextResponse.json({ error: "Valid url required" }, { status: 400 });
  }

  const cleanEvents = events.filter((e: string) => ALLOWED_EVENTS.has(e));
  if (!cleanEvents.length) {
    return NextResponse.json({ error: "events required" }, { status: 400 });
  }

  const hook = await createHook({ ownerId, url, events: cleanEvents as any });

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
    secret: hook.secret, // shown once
  });
}
