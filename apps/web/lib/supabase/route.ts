import { createClient } from '@supabase/supabase-js'

let serverClient: ReturnType<typeof createClient> | null = null

export const createRouteClient = () => {
  if (!serverClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    serverClient = createClient(supabaseUrl, supabaseKey)
  }

  return serverClient
}

export const supabaseRouteClient = () => createRouteClient()

export default createRouteClient
