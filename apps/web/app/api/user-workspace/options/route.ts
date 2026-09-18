import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const config = await getCoderLaunchConfig();
    // No repository association exists in the production projects schema yet.
    // The UI lets a user provide a public repo and verifies it through GitHub.
    return NextResponse.json({ ...config, projects: [] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Coder launch options are temporarily unavailable.' }, { status: 503 });
  }
}
