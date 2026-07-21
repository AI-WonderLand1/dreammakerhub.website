import { logger } from '@/lib/logger';
/**
 * Hash a user ID for filesystem isolation
 * Uses a simple hash function for browser compatibility
 * In production, use a proper cryptographic hash
 */
export function hashForIsolation(input: string): string {
  // Simple hash function for demo purposes
  // In production, use crypto.subtle.digest for browser or crypto.createHash for Node.js
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex string and take first 16 chars
  return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 16);
}

/**
 * Generate a container ID for a user
 */
export function generateContainerId(userId: string, salt?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const hash = hashForIsolation(`${userId}-${salt || ''}-${timestamp}-${random}`);
  return `pc-container-${hash}`;
}

/**
 * Create a safe filesystem path from user ID
 */
export function createUserPath(userId: string, ...segments: string[]): string {
  const hashedId = hashForIsolation(userId);
  const pathSegments = ['users', hashedId, ...segments];
  return pathSegments.join('/');
}

/**
 * Validate that a path is safe (no directory traversal)
 */
export function isPathSafe(path: string): boolean {
  // Prevent directory traversal
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) {
    return false;
  }

  // Prevent hidden files (except .well-known)
  const parts = path.split('/');
  for (const part of parts) {
    if (part.startsWith('.') && part !== '.well-known') {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize a filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[\/\\]/g, '-')
    .replace(/\0/g, '')
    .replace(/\.\./g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}