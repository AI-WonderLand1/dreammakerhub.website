'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

// Minimal Supabase auth context stub used for builds.
// Replace with real Supabase client integration later.
type AuthContextState = {
  user: any | null
  loading: boolean
  signIn?: (...args: any[]) => Promise<void>
  signOut?: () => Promise<void>
}

const AuthContext = createContext<AuthContextState>({ user: null, loading: false })

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // no-op stub: integrate real supabase client here
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useSupabaseAuth = () => useContext(AuthContext)
export default useSupabaseAuth
