import type { UserSession } from '../types/isolation';
import { hashForIsolation } from './hashing';

export async function getCurrentUserSession(): Promise<UserSession | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // For demo purposes, return a mock user session
    // In production, integrate with your authentication system
    const mockUserId = 'demo-user-' + Date.now();
    const hashedId = hashUserId(mockUserId);

    return {
      userId: mockUserId,
      email: 'demo@example.com',
      hashedId,
      token: '', // Would need to get session token
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    };
  } catch (error) {
    console.error('[Auth] Failed to get user session:', error);
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
    console.warn('[Auth] User session expired');
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
    console.error('[Auth] Failed to extract user ID from token:', error);
    return null;
  }
}