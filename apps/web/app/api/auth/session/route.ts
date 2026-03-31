import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { logger } from '@lib/logger';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Session error', { error });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to get session',
          session: null,
          user: null
        },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json({
        success: true,
        session: null,
        user: null
      });
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Get user usage data
    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    return NextResponse.json({
      success: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        email_confirmed: session.user.email_confirmed_at !== null,
        created_at: session.user.created_at,
        profile: profile || null,
        usage: usage || null,
      }
    });

  } catch (error: any) {
    logger.error('Unexpected session error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred',
        session: null,
        user: null
      },
      { status: 500 }
    );
  }
}
