import type { SceneGenerationJob } from '../jobs/sceneJob'

export async function generateSceneJson(job: SceneGenerationJob) {
  return {
    entities: [
      {
        name: 'Root',
        components: {
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      },
    ],
    meta: {
      jobId: job.jobId,
      prompt: job.prompt || '',
      generatedAt: new Date().toISOString(),
    },
  }
}
