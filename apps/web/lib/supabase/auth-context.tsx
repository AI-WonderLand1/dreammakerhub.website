'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from './client'

type AuthUser = {
  id: string
  email?: string
  [key: string]: any
}

type AuthContextState = {
  user: AuthUser | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error?: Error }>
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error?: Error }>
}

const AuthContext = createContext<AuthContextState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  signUp: async () => ({}),
  signInWithOAuth: async () => ({}),
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient()
    
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    if (!supabase) {
      clearTimeout(timeout);
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      if (!cancelled) {
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
        setLoading(false)
      }
    }).catch(() => {
      clearTimeout(timeout);
      if (!cancelled) {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!cancelled) {
        setSession(s ?? null)
        setUser(s?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error?: Error }> => {
    const supabase = createClient()
    if (!supabase) {
      return { error: new Error('Supabase is not configured in this environment.') }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: new Error(error.message) } : {}
  }

  const signInWithOAuth = async (provider: 'github' | 'google') => {
    const supabase = createClient()
    if (!supabase) {
      return { error: new Error('Supabase is not configured in this environment.') }
    }
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    })
    return error ? { error: new Error(error.message) } : {}
  }

  const signUp = async (email: string, password: string): Promise<{ error?: Error }> => {
    const supabase = createClient()
    if (!supabase) {
      return { error: new Error('Supabase is not configured in this environment.') }
    }
    const { error } = await supabase.auth.signUp({ email, password })
    return error ? { error: new Error(error.message) } : {}
  }

  const signOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
  }

  const signInWithOAuth = async (provider: 'github' | 'google') => {
    const supabase = createClient()
    if (!supabase) {
      return { error: new Error('Supabase is not configured in this environment.') }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`
      }
    })
    return error ? { error: new Error(error.message) } : {}
  }

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
