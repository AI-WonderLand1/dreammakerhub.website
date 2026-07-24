'use client'

import { createBrowserClient } from '@supabase/ssr'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

let cachedClient: ReturnType<typeof createBrowserClient> | null = null
let configPromise: Promise<{ url: string; anonKey: string } | null> | null = null

export async function ensureSupabaseConfig() {
  if (supabaseUrl && supabaseAnonKey) {
    return { url: supabaseUrl, anonKey: supabaseAnonKey }
  }

  if (configPromise) return configPromise

  configPromise = fetch('/api/config/supabase')
    .then(async (res) => {
      if (!res.ok) throw new Error('Failed to fetch Supabase config')
      const config = await res.json()
      if (config.url && config.anonKey) {
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
  if (!supabaseUrl || !supabaseAnonKey) return null

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        if (typeof document === 'undefined') return ''
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
        return cookie ? cookie.split('=')[1] : ''
      },
      set(name, value, opts) {
        if (typeof document === 'undefined') return
        const maxAge = opts?.maxAge ?? 604800
        let cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
        if (opts?.secure) cookie += '; Secure'
        document.cookie = cookie
      },
      remove(name, _opts) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
      },
    },
  })
  return cachedClient
}

export function createClient() {
  return getSupabaseClient()
}
