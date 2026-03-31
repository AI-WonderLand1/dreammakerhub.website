import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";
import { getProjectMetadata, updateProjectMetadata } from "@lib/projects/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const meta = await getProjectMetadata(params.projectId, smokeUserId ?? user!.id);
  return NextResponse.json({ domain: meta.customDomain ?? null });
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const domain = typeof body?.domain === "string" ? body.domain.trim().toLowerCase() : "";
  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }
  const meta = await updateProjectMetadata(params.projectId, smokeUserId ?? user!.id, { customDomain: domain });
  return NextResponse.json({
    ok: true,
    domain: meta.customDomain,
    instructions: `Point your domain's A/ALIAS/CNAME to this app and we will serve from /published/${params.projectId}/${meta.lastPublishId ?? "latest"}.`,
  });
}
