import { NextResponse } from "next/server"
import { getStorageManager } from "@/lib/storage/StorageManager"

export async function POST(req: Request) {
  const { workspaceId, sceneId, scene } = await req.json()

  if (!workspaceId || !sceneId || !scene) {
    return NextResponse.json({ error: "Missing required fields: workspaceId, sceneId, scene" }, { status: 400 })
  }

  const storage = getStorageManager()
  const result = await storage.saveProject(`${workspaceId}/${sceneId}`, scene, workspaceId)

  return NextResponse.json({ ok: true, path: result.url, id: result.id })
}
