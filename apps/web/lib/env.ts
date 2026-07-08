/**
 * Shared environment variables that are safe to use in both client and server contexts.
 * These are all prefixed with NEXT_PUBLIC_ or are non-sensitive configuration.
 * 
 * WARNING: Do NOT add server-side secrets here. This object may be imported by client components.
 * For server-only secrets, use serverEnv or access process.env directly in server-side code.
 */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || '',
  NEXT_PUBLIC_WORKSPACE_DOMAIN: process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_GOOGLE_AI_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  AGENT_API_URL: process.env.AGENT_API_URL || 'http://localhost:8000',
}

export function requireEnv(key: string, friendlyName?: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${friendlyName || key}`)
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
  get GOOGLE_AI_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('GOOGLE_AI_API_KEY cannot be accessed on the client side')
    }
    return process.env.GOOGLE_AI_API_KEY || ''
  },
  get GROQ_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('GROQ_API_KEY cannot be accessed on the client side')
    }
    return process.env.GROQ_API_KEY || ''
  },
  get GITHUB_MODELS_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('GITHUB_MODELS_API_KEY cannot be accessed on the client side')
    }
    return process.env.GITHUB_MODELS_API_KEY || ''
  },
  get OPENCODE_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('OPENCODE_API_KEY cannot be accessed on the client side')
    }
    return process.env.OPENCODE_API_KEY || ''
  },
  get GEMINI_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('GEMINI_API_KEY cannot be accessed on the client side')
    }
    return process.env.GEMINI_API_KEY || ''
  },
  get NEXTAUTH_SECRET() {
    if (typeof window !== 'undefined') {
      throw new Error('NEXTAUTH_SECRET cannot be accessed on the client side')
    }
    return process.env.NEXTAUTH_SECRET || ''
  },
  get ALICE_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('ALICE_API_KEY cannot be accessed on the client side')
    }
    return process.env.ALICE_API_KEY || ''
  },
  get N8N_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('N8N_API_KEY cannot be accessed on the client side')
    }
    return process.env.N8N_API_KEY || ''
  },
  get EXTENSION_ENCRYPTION_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('EXTENSION_ENCRYPTION_KEY cannot be accessed on the client side')
    }
    return process.env.EXTENSION_ENCRYPTION_KEY || ''
  },
}

export default env
