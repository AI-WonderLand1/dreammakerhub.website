import { NextRequest, NextResponse } from 'next/server'
import { promoteTempScene } from '@infra/services/storage/promoteTempScene'

export const runtime = 'nodejs'

type PromotePayload = {
  jobId?: string
  projectId?: string
  sceneId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PromotePayload
    const jobId = body.jobId?.trim()
    const projectId = body.projectId?.trim()
    const sceneId = body.sceneId?.trim()

    if (!jobId || !projectId || !sceneId) {
      return NextResponse.json({ error: 'jobId, projectId, and sceneId are required' }, { status: 400 })
    }

    const result = await promoteTempScene({ jobId, projectId, sceneId })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to promote temp scene' },
      { status: 500 },
    )
  }
}
