'use client'

import { createBrowserClient } from '@supabase/ssr'

type SupabasePublicConfig = {
  url: string
  anonKey: string
}

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
let supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.trim()

function isUsableSupabaseValue(value: string | undefined) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 && !normalized.includes('placeholder') && !normalized.includes('invalid')
}

function isUsableSupabaseUrl(value: string | undefined) {
  if (!isUsableSupabaseValue(value)) return false
  try {
    const parsed = new URL(value!)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function hasUsableSupabaseConfig() {
  return isUsableSupabaseUrl(supabaseUrl) && isUsableSupabaseValue(supabaseAnonKey)
}

// This reflects the build-time public environment only. Runtime fallback is
// handled by ensureSupabaseConfig() for deployments that inject env at start.
export const isSupabaseConfigured = hasUsableSupabaseConfig()

let cachedClient: ReturnType<typeof createBrowserClient> | null = null
let configPromise: Promise<SupabasePublicConfig | null> | null = null

async function loadRuntimeSupabaseConfig(): Promise<SupabasePublicConfig | null> {
  const response = await fetch('/api/config/supabase', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  const payload = await response.json().catch(() => null) as
    | { url?: unknown; anonKey?: unknown; error?: unknown }
    | null

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : `Supabase configuration endpoint returned HTTP ${response.status}`
    throw new Error(message)
  }

  const url = typeof payload?.url === 'string' ? payload.url.trim() : undefined
  const anonKey = typeof payload?.anonKey === 'string' ? payload.anonKey.trim() : undefined

  if (!isUsableSupabaseUrl(url) || !isUsableSupabaseValue(anonKey)) {
    throw new Error('Supabase configuration endpoint returned invalid public configuration')
  }

  supabaseUrl = url
  supabaseAnonKey = anonKey
  return { url, anonKey }
}

export async function ensureSupabaseConfig(): Promise<SupabasePublicConfig | null> {
  if (hasUsableSupabaseConfig()) {
    return { url: supabaseUrl!, anonKey: supabaseAnonKey! }
  }

  if (!configPromise) {
    configPromise = loadRuntimeSupabaseConfig().catch((error) => {
      console.error('[supabase-config] Unable to load browser authentication configuration:', error)
      return null
    })
  }

  try {
    return await configPromise
  } finally {
    // Do not permanently cache a failed startup/config request. A later login
    // click can retry after a transient deploy, proxy, or environment issue.
    configPromise = null
  }
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient
  if (!hasUsableSupabaseConfig()) return null

  // Let @supabase/ssr manage browser cookies itself. Its cookie adapter handles
  // the chunked/base64 auth-cookie format used by current Supabase releases.
  cachedClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  return cachedClient
}

export function createClient() {
  return getSupabaseClient()
}
