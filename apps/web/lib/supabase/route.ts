export { createClient as createRouteClient } from '@/app/utils/supabase/server'

export const supabaseRouteClient = async () => {
  const { createClient } = await import('@/app/utils/supabase/server')
  return createClient()
}

export default async function createRouteClientDefault() {
  const { createClient } = await import('@/app/utils/supabase/server')
  return createClient()
}
