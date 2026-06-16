import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { z } from 'zod';
import { createClient } from '@/app/utils/supabase/server';
import { logger } from '@lib/logger';

// Simple in-memory rate limiter for login attempts
// TODO: Replace with Redis for production
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // 5 attempts
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.resetTime) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt || now > attempt.resetTime) {
    // First attempt or window expired
    loginAttempts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (attempt.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  attempt.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - attempt.count };
}

// Validation schema
const LoginSchema = z.object({
  email: z.string().email("Invalid email format").max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP + email combination
    const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const identifier = `login:${clientIp}`;
    const rateLimit = checkRateLimit(identifier);

    if (!rateLimit.allowed) {
      logger.warn('Login rate limit exceeded', { ip: clientIp });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again in 15 minutes.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // Parse and validate input
    let body: z.infer<typeof LoginSchema>;
    try {
      const jsonBody = await request.json();
      const result = LoginSchema.safeParse(jsonBody);
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid input',
            details: result.error.issues
          },
          { status: 400 }
        );
      }
      body = result.data;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    const supabase = await createClient();

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      logger.error('Login error', { error: error.message, email: email.slice(0, 3) + '***' });
      
      // ALWAYS return same error message (prevent user enumeration)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          }
        }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed' 
        },
        { status: 500 }
      );
    }

    // Clear rate limit on successful login
    loginAttempts.delete(identifier);

    // Track login analytics (optional, non-blocking)
    try {
      await supabase.from('user_analytics').insert({
        user_id: data.user.id,
        event_type: 'login',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip: clientIp.slice(0, 10) + '***' // Mask IP
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
    }, {
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      }
    });

  } catch (error: unknown) {
    logger.error('Unexpected login error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
=======

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.redirect(new URL('/api/auth/replit-login', _request.url));
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}

export async function GET(request: NextRequest) {
<<<<<<< HEAD
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/auth?error=oauth_failed', request.url)
    );
  }

  return NextResponse.redirect(
    new URL('/dashboard', request.url)
  );
=======
  return NextResponse.redirect(new URL('/api/auth/replit-login', request.url));
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}
