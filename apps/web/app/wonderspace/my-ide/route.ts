import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Existing operator workspace and app URL, confirmed by the operator.
// A public route must never accept an arbitrary workspace URL, owner, or ID.
const OPERATOR_IDE_URL = 'https://coder.dreammakerhub.website/@wonderingtribe/production.main/apps/code-server/?folder=/home/coder';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!adminIds.includes(user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // This redirects the operator's browser, not the Coder API token. Coder
  // independently authenticates the browser and authorizes the IDE app.
  return NextResponse.redirect(OPERATOR_IDE_URL, {
    status: 303,
    headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
