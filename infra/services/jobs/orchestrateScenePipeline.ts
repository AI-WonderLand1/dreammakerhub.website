import { randomUUID } from 'crypto'
import { generateSceneJson } from '../storage/generateSceneJson'
import { uploadSceneToTemp } from '../storage/uploadSceneToTemp'
import { promoteTempScene } from '../storage/promoteTempScene'
import { saveSceneRecord } from '../workspace/saveSceneRecord'
import type { SceneGenerationJob } from './sceneJob'

type OrchestrateSceneInput = {
  projectId: string
  sceneId: string
  prompt?: string
  jobId?: string
}

export async function orchestrateScenePipeline(input: OrchestrateSceneInput) {
  const job: SceneGenerationJob = {
    jobId: input.jobId?.trim() || randomUUID(),
    projectId: input.projectId,
    sceneId: input.sceneId,
    prompt: input.prompt,
  }

  const sceneJson = await generateSceneJson(job)
  await uploadSceneToTemp(job.jobId, sceneJson, [])

  const promoted = await promoteTempScene({
    jobId: job.jobId,
    projectId: input.projectId,
    sceneId: input.sceneId,
  })

  await saveSceneRecord({
    projectId: input.projectId,
    sceneId: input.sceneId,
    sceneUrl: promoted.sceneUrl,
  })

  return {
    jobId: job.jobId,
    sceneUrl: promoted.sceneUrl,
    projectId: input.projectId,
    sceneId: input.sceneId,
  }
}
