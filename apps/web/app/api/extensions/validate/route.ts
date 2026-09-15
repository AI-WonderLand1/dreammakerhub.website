import { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '@/lib/env'
import { requireUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = await req.json().catch(() => null)
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    userId: _ignoredUserId,
    user_id: _ignoredSnakeUserId,
    ownerId: _ignoredOwnerId,
    owner_id: _ignoredSnakeOwnerId,
    ...rest
  } = parsedBody as Record<string, unknown>

  const res = await fetch(
    `${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/extensions-validate-upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ ...rest, userId, user_id: userId }),
      cache: 'no-store',
    },
  )

  const data = await res.json().catch(() => ({ error: 'Extension validation service returned an invalid response' }))
  return NextResponse.json(data, {
    status: res.status,
    headers: { 'Cache-Control': 'no-store' },
  })
}
