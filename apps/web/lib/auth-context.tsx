import { logger } from '@/lib/logger';
'use client'

export {
  AuthProvider as SupabaseAuthProvider,
  useSupabaseAuth as default,
  useAuth,
  useSupabase,
} from '@/lib/supabase/auth-context'
