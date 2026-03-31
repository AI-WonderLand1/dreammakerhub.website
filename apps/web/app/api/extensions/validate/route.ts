import { NextRequest, NextResponse } from 'next/server'
import { env, requireEnv } from '@lib/env'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(
    `${requireEnv(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL")}/functions/v1/extensions-validate-upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requireEnv(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify(body)
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
