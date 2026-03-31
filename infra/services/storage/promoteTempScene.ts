import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from '../../lib/env'

type PromoteTempSceneArgs = {
  jobId: string
  projectId: string
  sceneId: string
  tempBucket?: string
  finalBucket?: string
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

export async function promoteTempScene({
  jobId,
  projectId,
  sceneId,
  tempBucket = 'temp',
  finalBucket = 'projects',
}: PromoteTempSceneArgs) {
  const client = getSupabase()

  const tempScenePath = `scenes/${jobId}/scene.json`
  const tempAssetsPrefix = `scenes/${jobId}/assets`
  const finalScenePath = `projects/${projectId}/scenes/${sceneId}/scene.json`
  const finalAssetsPrefix = `projects/${projectId}/assets/${sceneId}`

  const { data: sceneData, error: sceneDownloadError } = await client.storage
    .from(tempBucket)
    .download(tempScenePath)

  if (sceneDownloadError || !sceneData) {
    throw new Error(sceneDownloadError?.message || 'Missing temp scene.json')
  }

  const { error: sceneUploadError } = await client.storage
    .from(finalBucket)
    .upload(finalScenePath, sceneData, { upsert: true, contentType: 'application/json' })

  if (sceneUploadError) {
    throw new Error(sceneUploadError.message)
  }

  const { data: assets, error: assetListError } = await client.storage.from(tempBucket).list(tempAssetsPrefix, {
    limit: 1000,
  })

  if (assetListError) {
    throw new Error(assetListError.message)
  }

  for (const asset of assets ?? []) {
    if (!asset.name || asset.name.endsWith('/')) continue

    const sourcePath = `${tempAssetsPrefix}/${asset.name}`
    const destinationPath = `${finalAssetsPrefix}/${asset.name}`

    const { data: assetData, error: assetDownloadError } = await client.storage
      .from(tempBucket)
      .download(sourcePath)

    if (assetDownloadError || !assetData) {
      throw new Error(assetDownloadError?.message || `Missing temp asset: ${asset.name}`)
    }

    const { error: assetUploadError } = await client.storage
      .from(finalBucket)
      .upload(destinationPath, assetData, { upsert: true })

    if (assetUploadError) {
      throw new Error(assetUploadError.message)
    }
  }

  const baseUrl = requireEnv(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, 'SUPABASE_URL')
  const sceneUrl = `${baseUrl}/storage/v1/object/public/${finalBucket}/${finalScenePath}`

  return {
    sceneUrl,
    finalScenePath,
    finalAssetsPrefix: `${finalAssetsPrefix}/`,
  }
}
