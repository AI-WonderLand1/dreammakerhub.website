import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { getPublicGithubRepository, normalizePublicGithubRepo } from '@/lib/coder/launch-options';

export const dynamic = 'force-dynamic';

/** Read-only repository inspection. NEVER imports code or creates a workspace. */
export async function GET(request: NextRequest) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in before inspecting a repository.' }, { status: 401 });
  const raw = request.nextUrl.searchParams.get('repository');
  if (!raw || raw.length > 250) {
    return NextResponse.json({ error: 'Enter a public GitHub URL or owner/repository.' }, { status: 400 });
  }
  const normalized = normalizePublicGithubRepo(raw);
  if (!normalized) {
    return NextResponse.json({ error: 'Only a public github.com/owner/repository URL is supported for preview.' }, { status: 400 });
  }
  try {
    const repo = await getPublicGithubRepository(normalized);
    return NextResponse.json({
      repository: repo.fullName,
      defaultBranch: repo.defaultBranch,
      branches: repo.branches,
      importAvailable: false,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Public repository or branches could not be verified. Private GitHub access is not connected.' }, { status: 422 });
  }
}
