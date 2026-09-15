import { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '@/lib/env'
import { requireUserId } from '@/lib/auth'

function bindAuthenticatedUser(body: unknown, userId: string): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const {
    userId: _ignoredUserId,
    user_id: _ignoredSnakeUserId,
    ownerId: _ignoredOwnerId,
    owner_id: _ignoredSnakeOwnerId,
    ...rest
  } = body as Record<string, unknown>

  return {
    ...rest,
    userId,
    user_id: userId,
  }
}

async function proxyExtensionRequest(req: NextRequest, method: 'POST' | 'DELETE') {
  const userId = await requireUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = await req.json().catch(() => null)
  const body = bindAuthenticatedUser(parsedBody, userId)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const res = await fetch(
    `${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/extensions`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )

  const data = await res.json().catch(() => ({ error: 'Extension service returned an invalid response' }))
  return NextResponse.json(data, {
    status: res.status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest) {
  return proxyExtensionRequest(req, 'POST')
}

export async function DELETE(req: NextRequest) {
  return proxyExtensionRequest(req, 'DELETE')
}
