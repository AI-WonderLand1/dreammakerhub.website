import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

const VERSION = '2026-10-13-v1';
const NO_STORE = { 'Cache-Control': 'no-store' };

async function verifiedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

export async function GET() {
  const { supabase, user } = await verifiedUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from('ai_training_preferences')
    .select('enabled,consent_version,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  // Do not silently pretend a missing migration/database error means an opt-out.
  if (error) {
    return NextResponse.json({ error: 'Privacy preferences are temporarily unavailable' }, { status: 503, headers: NO_STORE });
  }

  return NextResponse.json({
    enabled: data?.enabled === true && data?.consent_version === VERSION,
    consentVersion: data?.consent_version ?? VERSION,
    updatedAt: data?.updated_at ?? null,
  }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  // Session cookies must never permit a cross-origin training opt-in.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403, headers: NO_STORE });
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'JSON body required' }, { status: 415, headers: NO_STORE });
  }

  const { supabase, user } = await verifiedUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: NO_STORE });
  }
  if (!body || typeof body !== 'object' || typeof (body as { enabled?: unknown }).enabled !== 'boolean') {
    return NextResponse.json({ error: 'An explicit true or false choice is required' }, { status: 400, headers: NO_STORE });
  }

  const enabled = (body as { enabled: boolean }).enabled;
  const { error } = await supabase.rpc('set_ai_training_consent', { p_enabled: enabled });
  if (error) {
    // Fail closed. Never report consent as saved if the DB could not record it.
    return NextResponse.json({ error: 'Privacy preference could not be saved' }, { status: 503, headers: NO_STORE });
  }

  return NextResponse.json({ enabled, consentVersion: VERSION, saved: true }, { headers: NO_STORE });
}
