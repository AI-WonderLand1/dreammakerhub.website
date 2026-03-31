import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { env, requireEnv } from '@lib/env';
import { logger } from '@lib/logger';

export const runtime = "nodejs";

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

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

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${requireEnv(env.NEXT_PUBLIC_URL, "NEXT_PUBLIC_URL")}/auth/update-password`,
      }
    );

    if (error) {
      logger.error('Password reset error', { error });
      // Don't reveal if email exists for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent! Please check your inbox.'
    });

  } catch (error: any) {
    logger.error('Unexpected reset error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}

// Update password with token
export async function PUT(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'New password is required' 
        },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 8 characters long' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      logger.error('Password update error', { error });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update password' 
        },
        { status: 500 }
      );
    }

    // Track password change
    if (data.user) {
      try {
        await supabase.from('user_analytics').insert({
          user_id: data.user.id,
          event_type: 'password_changed',
          created_at: new Date().toISOString()
        });
      } catch (analyticsError) {
        logger.error('Analytics error', { error: analyticsError });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!'
    });

  } catch (error: any) {
    logger.error('Unexpected update error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
