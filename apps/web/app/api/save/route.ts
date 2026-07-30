import { NextResponse } from "next/server"
import { getStorageManager } from "@/lib/storage/StorageManager"
import { requireUserId } from "@/lib/auth"
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, sceneId, scene } = await req.json()

  if (!workspaceId || !sceneId || !scene) {
    return NextResponse.json({ error: "Missing required fields: workspaceId, sceneId, scene" }, { status: 400 })
  }

  const storage = getStorageManager()
  const result = await storage.saveProject(`${workspaceId}/${sceneId}`, scene, workspaceId)

  return NextResponse.json({ ok: true, path: result.url, id: result.id })
}
