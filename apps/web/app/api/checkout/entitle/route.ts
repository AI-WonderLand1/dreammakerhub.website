import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { updateProjectMetadata } from "@lib/projects/storage";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const projectId = typeof body?.projectId === "string" ? body.projectId : null;
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  await updateProjectMetadata(projectId, smokeUserId ?? user!.id, { publishEnabled: true });
  return NextResponse.json({ ok: true });
}
