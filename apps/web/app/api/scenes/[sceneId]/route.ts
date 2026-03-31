import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const { sceneId } = params

  const scene = await loadSceneFromProjects(sceneId)

  if (!scene) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(scene)
}

// --- helpers ---
async function loadSceneFromProjects(sceneId: string) {
  console.log("LOAD:", `projects/.../scenes/${sceneId}.json`)
  return null
}
