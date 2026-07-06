'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

let cachedClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (cachedClient) return cachedClient
  if (!isSupabaseConfigured) return null
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
