import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase-service'
import { provisionWorkspace, terminateWorkspace, getWorkspaceStatus, listUserWorkspaces, getWorkspaceUrls } from '@/lib/workspace'
import type { WorkspaceType } from '@/lib/workspace'

// Mark this route as dynamic to prevent static generation during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const CreateEnvironmentSchema = z.object({
  projectId: z.string().max(100).optional(),
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['ide', 'playcanvas', 'full']).default('full'),
  outputType: z.enum(['game', 'movie', 'both']).default('game').optional(),
})

const EnvironmentIdSchema = z.object({
  id: z.string().min(1).max(100),
})

// Helper function for auth
async function authenticateUser(request: Request): Promise<{ user: any; error?: NextResponse }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { user }
}

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await authenticateUser(request)
    if (authError) return authError

    // Validate input
    let body: z.infer<typeof CreateEnvironmentSchema>
    try {
      const jsonBody = await request.json()
      const result = CreateEnvironmentSchema.safeParse(jsonBody)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.issues },
          { status: 400 }
        )
      }
      body = result.data
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { projectId, name, type, outputType } = body

    const workspaceId = `ws-${user.id.slice(0, 8)}-${(projectId || Date.now().toString(36)).slice(0, 8)}`
    const workspaceType: WorkspaceType = type
    const workspaceName = name || `workspace-${workspaceId.slice(-6)}`

    // Check for existing environment
    const { data: existingEnv } = await supabase
      .from('user_environments')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId || '')
      .neq('status', 'deleted')
      .single()

    if (existingEnv) {
      const urls = getWorkspaceUrls(existingEnv.id)
      return NextResponse.json({
        environmentId: existingEnv.id,
        status: existingEnv.status,
        urls,
        message: 'Environment already exists',
      })
    }

    const workspace = await provisionWorkspace({
      workspaceId,
      userId: user.id,
      projectId,
      name: workspaceName,
      type: workspaceType,
      resources: { cpu: 2, memoryGB: 4, storageGB: 5 },
    })

    const { data: environment, error: envError } = await supabase
      .from('user_environments')
      .insert({
        id: workspaceId,
        user_id: user.id,
        project_id: projectId || null,
        status: workspace.status,
        resources: workspace.resources,
      })
      .select()
      .single()

    if (envError || !environment) {
      throw new Error('Failed to create environment record')
    }

    return NextResponse.json({
      environmentId: workspaceId,
      status: workspace.status,
      url: workspace.url,
      playcanvasUrl: workspace.playcanvasUrl,
      webglStudioUrl: workspace.webglStudioUrl,
      message: 'Workspace provisioned',
    })
  } catch (error) {
    console.error('Environment provisioning error:', error)
    return NextResponse.json(
      { error: 'Failed to provision environment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error: authError } = await authenticateUser(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const rawId = searchParams.get('id')

    // Validate environment ID
    const idResult = EnvironmentIdSchema.safeParse({ id: rawId })
    if (!idResult.success) {
      return NextResponse.json(
        { error: 'Invalid environment ID', details: idResult.error.issues },
        { status: 400 }
      )
    }
    const environmentId = idResult.data.id

    const { data: environment } = await supabase
      .from('user_environments')
      .select('*')
      .eq('id', environmentId)
      .eq('user_id', user.id)
      .single()

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
    }

    await terminateWorkspace(environmentId)

    await supabase
      .from('user_environments')
      .update({ status: 'deleted' })
      .eq('id', environmentId)

    return NextResponse.json({ message: 'Environment terminated' })
  } catch (error) {
    console.error('Environment termination error:', error)
    return NextResponse.json({ error: 'Failed to terminate environment' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await authenticateUser(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const rawId = searchParams.get('id')

    // Validate if ID is provided
    let environmentId: string | null = null
    if (rawId) {
      const idResult = EnvironmentIdSchema.safeParse({ id: rawId })
      if (!idResult.success) {
        return NextResponse.json(
          { error: 'Invalid environment ID', details: idResult.error.issues },
          { status: 400 }
        )
      }
      environmentId = idResult.data.id
    }

    if (environmentId) {
      const workspaceInfo = await getWorkspaceStatus(environmentId)

      const { data: environment } = await supabase
        .from('user_environments')
        .select('*')
        .eq('id', environmentId)
        .eq('user_id', user.id)
        .single()

      if (!environment) {
        return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
      }

      return NextResponse.json({
        environment,
        workspace: workspaceInfo,
      })
    }

    const [environments, workspaces] = await Promise.all([
      supabase
        .from('user_environments')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false }),
      listUserWorkspaces(user.id),
    ])

    return NextResponse.json({
      environments: environments.data || [],
      workspaces,
    })
  } catch (error) {
    console.error('Environment fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch environments' }, { status: 500 })
  }
}
