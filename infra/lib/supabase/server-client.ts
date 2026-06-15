import { createClient as createServerClient } from '@supabase/supabase-js'

let serverClient: ReturnType<typeof createServerClient> | null = null

export const createClient = () => {
  if (!serverClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    serverClient = createServerClient(supabaseUrl, supabaseKey)
  }
  return serverClient
}

export default createClient
