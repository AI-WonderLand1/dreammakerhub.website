'use client'

import { createBrowserClient } from '@supabase/ssr'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isPlaceholderValue(value: string) {
  return value.includes('placeholder') || value.includes('invalid')
}

function isUsableSupabaseUrl(value: string | undefined) {
  return !!value && !isPlaceholderValue(value)
}

function isUsableSupabaseAnonKey(value: string | undefined) {
  if (!value || isPlaceholderValue(value)) return false

  const parts = value.split('.')
  if (parts.length !== 3) return false

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'anon' && typeof payload.ref === 'string'
  } catch {
    return false
  }
}

function hasUsableSupabaseConfig() {
  return isUsableSupabaseUrl(supabaseUrl) && isUsableSupabaseAnonKey(supabaseAnonKey)
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
      if (isUsableSupabaseUrl(config.url) && isUsableSupabaseAnonKey(config.anonKey)) {
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

  const customFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    const urlStr = typeof url === 'string' ? url : url.toString()
    if (urlStr.includes('/auth/v1/token')) {
      headers.delete('Authorization')
    }
    return fetch(url, { ...init, headers })
  }

  cachedClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
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
    global: {
      fetch: customFetch,
    },
  })
  return cachedClient
}

export function createClient() {
  return getSupabaseClient()
}
