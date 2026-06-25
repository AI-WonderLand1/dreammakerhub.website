import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto";
import { SceneFile } from "@/lib/scene/schema"
import { requirePaidAIUser } from '@/app/api/ai/auth'
import { uploadAiAssetEntry } from '@/lib/ai/assetStore'
import { generate3DSceneDraft } from '@/lib/ai/threeDGenerator'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const paidUser = await requirePaidAIUser(req)
  if (paidUser instanceof NextResponse) return paidUser

  const { prompt, workspaceId } = await req.json()

  if (!workspaceId || !prompt) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'prompt and workspaceId are required' } }, { status: 400 })
  }

  const ai = generate3DSceneDraft(prompt)

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

  const stored = await uploadAiAssetEntry({
    id: scene.id,
    name: scene.metadata.name,
    description: `AI-generated scene: ${prompt}`,
    tags: ['ai-generated', '3d-scene'],
    userId: paidUser.userId,
    sceneData: scene,
    body: JSON.stringify(scene),
    contentType: 'application/json',
  })

  return NextResponse.json({ ok: true, scene, storage: stored })
}
