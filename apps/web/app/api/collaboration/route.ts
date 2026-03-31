import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('collaboration_sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: 'Failed to load collaboration sessions' }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

export async function POST(req: NextRequest) {
  const { projectId, userId, cursorPosition } = await req.json()
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('collaboration_sessions')
    .upsert({
      project_id: projectId,
      user_id: userId,
      cursor_position: cursorPosition,
      is_active: true,
      last_seen: new Date().toISOString(),
    })

  return NextResponse.json({ success: !error })
}
