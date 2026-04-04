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

export async function listAiAssetEntries(input: {
  userId: string
  workspaceId: string
  kind: 'image' | 'video' | 'model' | 'scene' | 'misc'
  limit?: number
}) {
  const bucket = process.env.AI_ASSETS_BUCKET?.trim() || 'ai-assets'
  const prefix = `users/${input.userId}/workspaces/${input.workspaceId}/${input.kind}`
  const max = Math.min(Math.max(input.limit ?? 20, 1), 100)

  const { data, error } = await supabaseRouteClient().storage.from(bucket).list(prefix, {
    limit: max,
    sortBy: { column: 'updated_at', order: 'desc' },
  })

  if (error) throw error

  const normalized = (data || [])
    .filter((item: any) => item?.name)
    .map((item: any) => {
      const path = `${prefix}/${item.name}`
      return {
        bucket,
        path,
        name: item.name as string,
        kind: input.kind,
        size: item.metadata?.size as number | undefined,
        updatedAt: item.updated_at as string | undefined,
      }
    })

  return normalized
}
