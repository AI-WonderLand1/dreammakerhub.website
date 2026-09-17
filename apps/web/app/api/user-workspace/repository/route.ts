import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getPublicGithubRepository, normalizePublicGithubRepo } from '@/lib/coder/launch-options';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const repo = normalizePublicGithubRepo(request.nextUrl.searchParams.get('repo'));
  if (!repo) return NextResponse.json({ error: 'Enter a valid GitHub owner/repository.' }, { status: 400 });
  try {
    const repository = await getPublicGithubRepository(repo);
    return NextResponse.json(repository, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'GitHub repository unavailable.' }, { status: 422 });
  }
}
