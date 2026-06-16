import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
<<<<<<< HEAD
    const supabase = await createClient();
=======
    const h = await headers();
    const userId = h.get('x-replit-user-id');
    const userName = h.get('x-replit-user-name');
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

    if (!userId || !userName) {
      return NextResponse.json({ success: true, session: null, user: null });
    }

    const user = {
      id: userId,
      email: `${userName}@users.replit.com`,
      name: userName,
      email_confirmed: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      session: { access_token: `replit-${userId}`, user },
      user,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Unexpected error', session: null, user: null }, { status: 500 });
  }
}
