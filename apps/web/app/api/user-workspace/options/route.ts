import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const config = await getCoderLaunchConfig();
    return NextResponse.json({ ...config, projects: [] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Coder launch options are temporarily unavailable.' }, { status: 503 });
  }
}
