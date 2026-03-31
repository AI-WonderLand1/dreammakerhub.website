import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from '../../lib/env'

type UploadAsset = {
  filename: string
  data: ArrayBuffer
}

let supabase: ReturnType<typeof createSupabaseClient> | null = null

function getSupabase() {
  if (!supabase) {
    const url = requireEnv(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, 'SUPABASE_URL')
    const key = requireEnv(
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      'SUPABASE_SERVICE_KEY',
    )

    supabase = createSupabaseClient(url, key)
  }

  return supabase
}

export async function uploadSceneToTemp(
  jobId: string,
  sceneJson: unknown,
  assets: UploadAsset[],
  bucket = 'temp',
) {
  const client = getSupabase()

  const scenePath = `scenes/${jobId}/scene.json`
  const { error: sceneError } = await client.storage
    .from(bucket)
    .upload(scenePath, Buffer.from(JSON.stringify(sceneJson)), {
      upsert: true,
      contentType: 'application/json',
    })

  if (sceneError) throw sceneError

  for (const asset of assets) {
    const assetPath = `scenes/${jobId}/assets/${asset.filename}`
    const { error: assetError } = await client.storage
      .from(bucket)
      .upload(assetPath, Buffer.from(asset.data), { upsert: true })

    if (assetError) throw assetError
  }

  return {
    scenePath,
    assetsBasePath: `scenes/${jobId}/assets/`,
  }
}
