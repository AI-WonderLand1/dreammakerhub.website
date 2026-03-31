import { SupabaseProvider } from '../storage/SupabaseProvider'

export async function saveSceneRecord(params: {
  projectId: string
  sceneId: string
  sceneUrl: string
}) {
  const client = SupabaseProvider.getClient()

  const { error } = await client.from('workspace_scenes').upsert(
    {
      project_id: params.projectId,
      scene_id: params.sceneId,
      scene_url: params.sceneUrl,
    },
    { onConflict: 'project_id,scene_id' },
  )

  if (error) throw error
}
