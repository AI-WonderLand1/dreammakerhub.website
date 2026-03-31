import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { listSnapshots, restoreSnapshot } from "@lib/projects/storage";
import { logger } from "@lib/logger";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const snapshotId =
      typeof body?.snapshotId === "string" && body.snapshotId.trim() ? body.snapshotId.trim() : null;
    const ownerId = smokeUserId ?? user!.id;
    const snapshots = await listSnapshots(params.projectId, ownerId);
    const target = snapshotId ? snapshots.find((s) => s.id === snapshotId) : snapshots[0];
    if (!target) {
      return NextResponse.json({ error: "No snapshots available" }, { status: 404 });
    }
    const restored = await restoreSnapshot(params.projectId, ownerId, target.id);
    return NextResponse.json({ restored });
  } catch (error: any) {
    logger.error("Restore snapshot failed", { error });
    return NextResponse.json({ error: "Failed to restore snapshot" }, { status: 500 });
  }
}
