import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { logger } from '@lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      logger.error('Login error', { error });
      
      // User-friendly error messages
      let errorMessage = 'Login failed';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in';
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create session' 
        },
        { status: 500 }
      );
    }

    // Track login analytics (optional)
    try {
      await supabase.from('user_analytics').insert({
        user_id: data.user.id,
        event_type: 'login',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        },
        created_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      // Don't fail login if analytics fails
      logger.error('Analytics error', { error: analyticsError });
    }

    // Return user data and session
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: data.user.email_confirmed_at !== null,
        created_at: data.user.created_at,
        user_metadata: data.user.user_metadata,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      }
    });

  } catch (error: any) {
    logger.error('Unexpected login error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// Optional: Support OAuth redirects
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    );
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/auth?error=oauth_failed', request.url)
    );
  }

  return NextResponse.redirect(
    new URL('/dashboard', request.url)
  );
}
