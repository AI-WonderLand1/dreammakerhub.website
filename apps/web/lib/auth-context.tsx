'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

<<<<<<< HEAD
type AuthContextState = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

=======
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
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
const AuthContext = createContext<AuthContextState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
<<<<<<< HEAD
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    if (!supabase) return { error: new Error('Supabase not configured') }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const supabase = createClient()
    if (!supabase) return { error: new Error('Supabase not configured') }
    
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase?.auth.signOut()
    setUser(null)
    setSession(null)
=======
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user)
          setSession(data.session ?? { user: data.user })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const signIn = async (_email: string, _password: string) => {
    if (typeof window !== 'undefined') window.location.href = '/api/auth/replit-login'
    return { error: null }
  }

  const signUp = async (_email: string, _password: string) => {
    if (typeof window !== 'undefined') window.location.href = '/api/auth/replit-login'
    return { error: null }
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setSession(null)
    if (typeof window !== 'undefined') window.location.href = '/public-pages/auth'
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useSupabaseAuth = () => useContext(AuthContext)
export default useSupabaseAuth
