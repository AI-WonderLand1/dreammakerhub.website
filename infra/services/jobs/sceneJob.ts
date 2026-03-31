export type SceneGenerationJob = {
  jobId: string
  prompt?: string
  projectId?: string
  sceneId?: string
}

export type SceneGenerationResult = {
  jobId: string
  scenePath: string
  assetsBasePath: string
}
