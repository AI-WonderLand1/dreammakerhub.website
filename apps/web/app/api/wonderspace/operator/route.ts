import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  // The SSR cookie can belong to an older session while the browser has a
  // different current session. Prefer a supplied, verified Bearer token, never
  // an editable profile or a user ID taken from a request body or query string.
  const supabase = await createClient();
  const authorization = request.headers.get('authorization')?.trim() || '';
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]?.trim();
  if (authorization && !bearer) {
    return NextResponse.json({ error: 'Your DreamMakerHub session could not be verified.' }, {
      status: 401,
      headers: NO_STORE,
    });
  }
  const { data: { user }, error } = bearer
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Your DreamMakerHub session could not be verified.' }, {
      status: 401,
      headers: NO_STORE,
    });
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  return NextResponse.json({ isOperator: adminIds.includes(user.id) }, { headers: NO_STORE });
}
