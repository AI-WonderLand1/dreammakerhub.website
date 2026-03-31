import { createSupabaseServerClient as createServerClient } from '@/app/utils/supabase/server'

export async function createSupabaseServerClient() {
  return createServerClient()
}
