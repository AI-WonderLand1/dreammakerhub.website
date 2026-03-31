import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { logger } from '@lib/logger';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user for analytics
    const { data: { user } } = await supabase.auth.getUser();

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout error', { error });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to logout' 
        },
        { status: 500 }
      );
    }

    // Track logout analytics
    if (user) {
      try {
        await supabase.from('user_analytics').insert({
          user_id: user.id,
          event_type: 'logout',
          metadata: {
            user_agent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || 'unknown'
          },
          created_at: new Date().toISOString()
        });
      } catch (analyticsError) {
        logger.error('Analytics error', { error: analyticsError });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    logger.error('Unexpected logout error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
