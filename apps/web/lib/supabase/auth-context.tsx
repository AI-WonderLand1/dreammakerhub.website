'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from './client'

type AuthUser = {
  id: string
  email?: string
  name?: string
  [key: string]: any
}

type AuthContextState = {
  user: AuthUser | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'github' | 'google', options?: { redirectTo?: string }) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  signUp: async () => ({ error: null }),
  signInWithOAuth: async () => ({ error: null }),
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setUser(s.user as unknown as AuthUser)
        setSession(s)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        setUser(s.user as unknown as AuthUser)
        setSession(s)
      } else {
        setUser(null)
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google', options?: { redirectTo?: string }) => {
    const supabase = getSupabaseClient()
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signInWithOAuth({ provider, options })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/public-pages/auth'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, signUp, signInWithOAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useSupabaseAuth = () => useContext(AuthContext)
export const useAuth = () => useSupabaseAuth()
export const useSupabase = () => useSupabaseAuth()

export default useSupabaseAuth
