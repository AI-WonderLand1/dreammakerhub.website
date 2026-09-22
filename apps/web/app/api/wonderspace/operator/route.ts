import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  // Check the actual Supabase user, not an editable profile, a browser-provided
  // user ID, or whether the user can log in to the separate Coder dashboard.
  const user = await authenticatedSupabaseUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Your DreamMakerHub session could not be verified.' }, {
      status: 401,
      headers: NO_STORE,
    });
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  return NextResponse.json({ isOperator: adminIds.includes(user.id) }, { headers: NO_STORE });
}
