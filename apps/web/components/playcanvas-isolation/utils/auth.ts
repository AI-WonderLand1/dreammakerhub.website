import type { UserSession } from '../types/isolation';
import { hashForIsolation } from './hashing';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export async function getCurrentUserSession(): Promise<UserSession | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const supabaseUrl = (window as any).__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = (window as any).__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return null;

    const hashedId = hashUserId(session.user.id);

    return {
      userId: session.user.id,
      email: session.user.email || '',
      hashedId,
      token: session.access_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
    };
  } catch (error) {
    logger.error('[Auth] Failed to get user session:', error);
    return null;
  }
}

export function hashUserId(userId: string): string {
  return hashForIsolation(userId);
}

export function validateUserSession(session: UserSession): boolean {
  if (!session.userId || !session.hashedId) {
    return false;
  }

  // Check expiration
  if (Date.now() > session.expiresAt) {
    logger.warn('[Auth] User session expired');
    return false;
  }

  // Validate hash
  const expectedHash = hashUserId(session.userId);
  return session.hashedId === expectedHash;
}

export async function requireUserSession(): Promise<UserSession> {
  const session = await getCurrentUserSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

// JWT token extraction for service worker
export async function extractUserIdFromToken(token: string): Promise<string | null> {
  try {
    // This is a simplified version - in production, verify the JWT signature
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.userId || payload.id || null;
  } catch (error) {
    logger.error('[Auth] Failed to extract user ID from token:', error);
    return null;
  }
}