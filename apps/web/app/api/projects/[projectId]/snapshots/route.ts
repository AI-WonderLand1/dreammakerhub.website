import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { createSnapshot, listSnapshots } from "@lib/projects/storage";
import { logger } from "@lib/logger";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(_req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const snapshots = await listSnapshots(params.projectId, smokeUserId ?? user!.id);
    return NextResponse.json({ snapshots });
  } catch (error: any) {
    logger.error("List snapshots failed", { error });
    return NextResponse.json({ error: "Failed to list snapshots" }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(_req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const snapshot = await createSnapshot(params.projectId, smokeUserId ?? user!.id);
    return NextResponse.json({ snapshot });
  } catch (error: any) {
    logger.error("Create snapshot failed", { error });
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}
