import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-service'

export async function POST(request: Request) {
  try {
    // Get user from Supabase auth (simplified for now)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { projectId } = await request.json()
    
    // Validate project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
      
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })
    }
    
    // Check if environment already exists for this project
    const { data: existingEnv, error: envCheckError } = await supabase
      .from('user_environments')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .neq('status', 'deleted')
      .single()
      
    if (!envCheckError && existingEnv) {
      // Return existing environment
      return NextResponse.json({
        environmentId: existingEnv.id,
        status: existingEnv.status,
        message: 'Environment already exists',
        // In a real implementation, this would return connection details
        connectionInfo: {
          type: 'shared', // Placeholder - would be 'isolated' in full implementation
          message: 'Environment management system ready - isolated containers coming soon'
        }
      })
    }
    
    // Create new environment record (placeholder for now)
    const { data: environment, error: envError } = await supabase
      .from('user_environments')
      .insert({
        user_id: user.id,
        project_id: projectId,
        status: 'ready', // Changed from 'provisioning' to 'ready' for immediate use
        resources: { cpu: 2, memoryGB: 4 } // Default resources
      })
      .select()
      .single()
      
    if (envError || !environment) {
      throw new Error('Failed to create environment record')
    }
    
    return NextResponse.json({
      environmentId: environment.id,
      status: 'ready',
      message: 'Environment ready for use',
      // In full implementation, this would return actual connection details to isolated environment
      connectionInfo: {
        type: 'placeholder',
        message: 'Environment management system active - isolated cloud environments coming in next update',
        nextSteps: [
          'Environment record created in database',
          'Ready for Docker container integration',
          'Will connect to isolated editor instance when fully implemented'
        ]
      }
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
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const environmentId = searchParams.get('id')
    
    if (!environmentId) {
      return NextResponse.json({ error: 'Environment ID required' }, { status: 400 })
    }
    
    // Get environment and verify ownership
    const { data: environment, error: envError } = await supabase
      .from('user_environments')
      .select('*')
      .eq('id', environmentId)
      .eq('user_id', user.id)
      .single()
      
    if (envError || !environment) {
      return NextResponse.json({ error: 'Environment not found or access denied' }, { status: 404 })
    }
    
    // Update environment status
    await supabase
      .from('user_environments')
      .update({ status: 'deleted' })
      .eq('id', environmentId)
    
    return NextResponse.json({
      message: 'Environment terminated successfully'
    })
  } catch (error) {
    console.error('Environment termination error:', error)
    return NextResponse.json(
      { error: 'Failed to terminate environment' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const environmentId = searchParams.get('id')
    
    if (environmentId) {
      // Get specific environment
      const { data: environment, error: envError } = await supabase
        .from('user_environments')
        .select('*')
        .eq('id', environmentId)
        .eq('user_id', user.id)
        .single()
        
      if (envError || !environment) {
        return NextResponse.json({ error: 'Environment not found or access denied' }, { status: 404 })
      }
      
      return NextResponse.json({ environment })
    } else {
      // Get all environments for user
      const { data: environments, error: envsError } = await supabase
        .from('user_environments')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        
      if (envsError) {
        throw envsError
      }
      
      return NextResponse.json({ environments: environments || [] })
    }
  } catch (error) {
    console.error('Environment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    )
  }
}