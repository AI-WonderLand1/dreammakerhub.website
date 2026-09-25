import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Your DreamMakerHub session could not be verified.' },
      { status: 401, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    { isOperator: isConfiguredCoderOperator(user.id) },
    { headers: NO_STORE },
  );
}
