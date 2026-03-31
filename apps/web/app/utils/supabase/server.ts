import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function requireEnv(val: string | undefined, name: string) {
  if (!val || !String(val).trim()) throw new Error(`Missing ${name}`)
  return val
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createServerClient(
    requireEnv(supabaseUrl, "SUPABASE_URL"),
    requireEnv(supabaseAnonKey, "SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )
}


export async function createClient() {
  return createSupabaseServerClient()
}
