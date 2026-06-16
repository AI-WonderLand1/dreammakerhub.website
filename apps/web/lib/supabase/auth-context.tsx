'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

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

  const signIn = async (_email: string, _password: string): Promise<{ error?: Error }> => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/replit-login'
    }
    return {}
  }

  const signUp = async (_email: string, _password: string): Promise<{ error?: Error }> => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/replit-login'
    }
    return {}
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setSession(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/public-pages/auth'
    }
  }

  const signInWithOAuth = async (_provider: 'github' | 'google') => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/replit-login'
    }
    return {}
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
