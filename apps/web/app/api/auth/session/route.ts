import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';

export const runtime = 'nodejs';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    // getSession() reads the cookie and must not be treated as proof that the
    // user is still authenticated. Confessions and other private APIs verify
    // with getUser(); keep the session indicator consistent with those APIs.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: true, session: null, user: null }, { headers: noStore });
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || session.user.id !== user.id) {
      return NextResponse.json({ success: true, session: null, user: null }, { headers: noStore });
    }

    const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
    const isAdmin = adminUserIds.includes(user.id);
    return NextResponse.json({
      success: true,
      session: { access_token: session.access_token, user: { ...user, isAdmin } },
      user: { ...user, isAdmin },
    }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Unexpected error', session: null, user: null }, {
      status: 503, headers: noStore,
    });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Use GET to read session' }, { status: 405, headers: noStore });
}
