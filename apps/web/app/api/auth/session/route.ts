import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ success: true, session: null, user: null });
    }

    const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
    const isAdmin = adminUserIds.includes(session.user.id);

    return NextResponse.json({
      success: true,
      session: { access_token: session.access_token, user: { ...session.user, isAdmin } },
      user: { ...session.user, isAdmin },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Unexpected error', session: null, user: null }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Use GET to read session' }, { status: 405 });
}
