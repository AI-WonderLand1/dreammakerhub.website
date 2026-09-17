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
    // The user's existing DreamMakerHub project links are suggestions only.
    // Public GitHub access is verified separately before allowing a clone.
    const { data: projects } = await supabase
      .from('projects')
      .select('id,name,github_repo')
      .eq('user_id', user.id)
      .not('github_repo', 'is', null)
      .limit(50);
    return NextResponse.json({
      ...config,
      projects: (projects || []).filter((project) => project.github_repo),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Coder launch options are temporarily unavailable.' }, { status: 503 });
  }
}
