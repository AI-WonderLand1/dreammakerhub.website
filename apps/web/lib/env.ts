export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || '',
  NEXT_PUBLIC_GOOGLE_AI_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GITHUB_MODELS_API_KEY: process.env.GITHUB_MODELS_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
}

export function requireEnv(key: string, friendlyName?: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${friendlyName || key}`)
  }
  return value
}

export default env
