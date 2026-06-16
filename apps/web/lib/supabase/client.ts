'use client'

<<<<<<< HEAD
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let didWarnMissingEnv = false

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
};

export const createClient = () => {
  if (!isSupabaseConfigured) {
    if (!didWarnMissingEnv && typeof window !== 'undefined') {
      console.warn('Supabase is not configured: missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY')
      didWarnMissingEnv = true
    }
    return null
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}
=======
export const isSupabaseConfigured = false

export const getSupabaseClient = () => null
export const createClient = () => null
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
