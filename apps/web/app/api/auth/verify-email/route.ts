import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { env, requireEnv } from '@lib/env';
import { logger } from '@lib/logger';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification token is required' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      logger.error('Email verification error', { error });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired verification token' 
        },
        { status: 400 }
      );
    }

    // Track verification analytics
    if (data.user) {
      try {
        await supabase.from('user_analytics').insert({
          user_id: data.user.id,
          event_type: 'email_verified',
          created_at: new Date().toISOString()
        });
      } catch (analyticsError) {
        logger.error('Analytics error', { error: analyticsError });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: data.user
    });

  } catch (error: any) {
    logger.error('Unexpected verification error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email is required' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${requireEnv(env.NEXT_PUBLIC_URL, "NEXT_PUBLIC_URL")}/auth/verify-email`,
      }
    });

    if (error) {
      logger.error('Resend verification error', { error });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to resend verification email' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error: any) {
    logger.error('Unexpected resend error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
