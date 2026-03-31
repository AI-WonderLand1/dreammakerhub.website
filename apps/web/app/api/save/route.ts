import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { workspaceId, sceneId, scene } = await req.json()

  const path = `temp/${workspaceId}/editor/${sceneId}.json`
  await writeTemp(path, JSON.stringify(scene, null, 2))

  return NextResponse.json({ ok: true, path })
}

// TODO: replace with real storage
async function writeTemp(path: string, contents: string) {
  console.log("WRITE TEMP:", path)
}
