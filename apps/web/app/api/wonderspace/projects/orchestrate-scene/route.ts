import { NextRequest, NextResponse } from 'next/server'
import { orchestrateScenePipeline } from '@infra/services/jobs/orchestrateScenePipeline'

export const runtime = 'nodejs'

type OrchestratePayload = {
  projectId?: string
  sceneId?: string
  prompt?: string
  jobId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrchestratePayload
    const projectId = body.projectId?.trim()
    const sceneId = body.sceneId?.trim()

    if (!projectId || !sceneId) {
      return NextResponse.json({ error: 'projectId and sceneId are required' }, { status: 400 })
    }

    const result = await orchestrateScenePipeline({
      projectId,
      sceneId,
      prompt: body.prompt?.trim(),
      jobId: body.jobId?.trim(),
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to orchestrate scene pipeline' },
      { status: 500 },
    )
  }
}
