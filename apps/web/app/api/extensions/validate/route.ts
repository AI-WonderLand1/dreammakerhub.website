import { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '@/lib/env'
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(
    `${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/extensions-validate-upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify(body)
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
