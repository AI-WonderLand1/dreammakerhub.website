/**
 * Shared environment variables that are safe to use in both client and server contexts.
 * These are all prefixed with NEXT_PUBLIC_ or are non-sensitive configuration.
 * 
 * WARNING: Do NOT add server-side secrets here. This object may be imported by client components.
 * For server-only secrets, access process.env directly in server-side code (API routes, Server Components).
 */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_WORKSPACE_DOMAIN: process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
}

/**
 * Requires an environment variable to be set.
 * Use this in server-side code only.
 */
export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

/**
 * Server-only environment variables.
 * These MUST only be accessed in server-side code (API routes, Server Components).
 * Importing this in a client component will cause the secret to leak to the browser.
 */
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY cannot be accessed on the client side')
    }
    return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  get SECRETS_ENCRYPTION_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('SECRETS_ENCRYPTION_KEY cannot be accessed on the client side')
    }
    return process.env.SECRETS_ENCRYPTION_KEY || ''
  },
}

export default env
