import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { managedIdeWorkspaces } from '@/lib/managed-ide/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const workspaces = await managedIdeWorkspaces(user.id);
    return NextResponse.json({ workspaces }, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch {
    return NextResponse.json({ error: 'Workspace list is unavailable.' }, { status: 503 });
  }
}
