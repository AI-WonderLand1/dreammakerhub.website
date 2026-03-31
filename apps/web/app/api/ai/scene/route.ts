import { NextResponse } from "next/server"
import { SceneFile } from "@/lib/scene/schema"

export async function POST(req: Request) {
  const { prompt, workspaceId } = await req.json()

  const ai = await generateScene(prompt)

  const scene: SceneFile = {
    id: crypto.randomUUID(),
    workspaceId,
    metadata: {
      name: prompt,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    objects: ai.objects,
    materials: ai.materials,
    lights: ai.lights,
    camera: ai.camera,
    skybox: ai.skybox
  }

  await uploadToTemp(`temp/${workspaceId}/ai/scenes/${scene.id}.json`, scene)

  return NextResponse.json(scene)
}

// --- helpers ---
async function generateScene(prompt: string) {
  return {
    objects: [],
    materials: [],
    lights: [],
    camera: { position: [0,5,10] as [number,number,number], target: [0,0,0] as [number,number,number], fov: 60 },
    skybox: undefined
  }
}

async function uploadToTemp(path: string, data: any) {
  console.log("TEMP upload:", path)
}
