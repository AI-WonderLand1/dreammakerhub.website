import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { env, requireEnv } from '@lib/env';
import { logger } from '@lib/logger';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

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

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 8 characters long' 
        },
        { status: 400 }
      );
    }

    // Password complexity check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must contain uppercase, lowercase, and numbers' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An account with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Create user
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          onboarding_completed: false,
        },
        emailRedirectTo: `${requireEnv(env.NEXT_PUBLIC_URL, "NEXT_PUBLIC_URL")}/auth/verify-email`,
      },
    });

    if (error) {
      logger.error('Registration error', { error });
      
      let errorMessage = 'Registration failed';
      if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password does not meet requirements';
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create user account' 
        },
        { status: 500 }
      );
    }

    // Create initial profile
    try {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (profileError) {
      logger.error('Profile creation error', { error: profileError });
      // Don't fail registration if profile creation fails
    }

    // Initialize user usage limits
    try {
      await supabase.from('user_usage').insert({
        user_id: data.user.id,
        requests_used: 0,
        requests_limit: 200, // Free tier
        tokens_used: 0,
        tokens_limit: 10000,
        plan: 'free',
        created_at: new Date().toISOString(),
      });
    } catch (usageError) {
      logger.error('Usage initialization error', { error: usageError });
    }

    // Track registration analytics
    try {
      await supabase.from('user_analytics').insert({
        user_id: data.user.id,
        event_type: 'registration',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        },
        created_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      logger.error('Analytics error', { error: analyticsError });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: false,
      },
      // Include session if email verification is disabled
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      } : null
    });

  } catch (error: any) {
    logger.error('Unexpected registration error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
