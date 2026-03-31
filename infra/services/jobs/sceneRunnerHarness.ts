import { SceneGenerationJob, SceneGenerationResult } from './sceneJob'
import { uploadSceneToTemp } from '../storage/uploadSceneToTemp'
import { generateSceneJson } from '../storage/generateSceneJson'

export async function runSceneJobLocally(job: SceneGenerationJob): Promise<SceneGenerationResult> {
  const sceneJson = await generateSceneJson(job)
  const assets: { filename: string; data: ArrayBuffer }[] = []

  const { scenePath, assetsBasePath } = await uploadSceneToTemp(job.jobId, sceneJson, assets)

  return {
    jobId: job.jobId,
    scenePath,
    assetsBasePath,
  }
}
