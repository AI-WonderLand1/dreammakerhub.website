import { randomUUID } from 'crypto'
import { supabaseRouteClient } from '@lib/supabase/route'

export type UploadAiAssetInput = {
  userId: string
  workspaceId: string
  kind: 'image' | 'video' | 'model' | 'scene' | 'misc'
  filename: string
  contentType: string
  body: Buffer | string
}

export async function uploadAiAssetEntry(input: UploadAiAssetInput) {
  const bucket = process.env.AI_ASSETS_BUCKET?.trim() || 'ai-assets'
  const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]+/g, '_')
  const date = new Date().toISOString().slice(0, 10)
  const path = `users/${input.userId}/workspaces/${input.workspaceId}/${input.kind}/${date}/${randomUUID()}-${safeFilename}`

  const { error } = await supabaseRouteClient().storage.from(bucket).upload(path, input.body, {
    contentType: input.contentType,
    upsert: true,
  })

  if (error) throw error

  return { bucket, path }
}
