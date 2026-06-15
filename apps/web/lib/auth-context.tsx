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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
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
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useSupabaseAuth = () => useContext(AuthContext)
export default useSupabaseAuth
