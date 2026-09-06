'use client'

import { createBrowserClient } from '@supabase/ssr'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isUsableSupabaseValue(value: string | undefined) {
  return !!value && !value.includes('placeholder') && !value.includes('invalid')
}

function hasUsableSupabaseConfig() {
  return isUsableSupabaseValue(supabaseUrl) && isUsableSupabaseValue(supabaseAnonKey)
}

export const isSupabaseConfigured = hasUsableSupabaseConfig()

let cachedClient: ReturnType<typeof createBrowserClient> | null = null
let configPromise: Promise<{ url: string; anonKey: string } | null> | null = null

export async function ensureSupabaseConfig() {
  if (hasUsableSupabaseConfig()) {
    return { url: supabaseUrl!, anonKey: supabaseAnonKey! }
  }

  if (configPromise) return configPromise

  configPromise = fetch('/api/config/supabase')
    .then(async (res) => {
      if (!res.ok) throw new Error('Failed to fetch Supabase config')
      const config = await res.json()
      if (isUsableSupabaseValue(config.url) && isUsableSupabaseValue(config.anonKey)) {
        supabaseUrl = config.url
        supabaseAnonKey = config.anonKey
        return config
      }
      return null
    })
    .catch((err) => {
      console.error('Error ensuring Supabase config:', err)
      return null
    })

  return configPromise
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient
  if (!hasUsableSupabaseConfig()) return null

  // Let @supabase/ssr manage browser cookies itself. Its cookie adapter handles
  // the chunked/base64 auth-cookie format used by current Supabase releases.
  // The old hand-written document.cookie adapter only handled a single cookie
  // and could make an active session look logged out after navigation/reload.
  cachedClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  return cachedClient
}

export function createClient() {
  return getSupabaseClient()
}
