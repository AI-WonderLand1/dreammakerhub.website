import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('scenes')
    .select('id, name, description, thumbnail, is_public, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workspaces: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = body.name?.trim() || 'My 3D Workspace'

  const defaultScene = {
    objects: [],
    materials: [],
    lights: [
      { id: 'light-1', type: 'directional', color: [1, 1, 1], intensity: 1, direction: [0.5, -1, -0.5] },
      { id: 'light-2', type: 'ambient', color: [0.4, 0.4, 0.5], intensity: 0.6 },
    ],
    camera: { position: [0, 3, 8], target: [0, 0, 0], fov: 45 },
    skybox: null,
  }

  const { data, error } = await supabase
    .from('scenes')
    .insert({
      user_id: user.id,
      name,
      description: body.description || '',
      data: defaultScene,
      is_public: false,
    })
    .select('id, name, description, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workspace: data }, { status: 201 })
}
