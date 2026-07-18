'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, setAuthToken, getAuthToken } from './api'

interface User {
  id: string
  username: string
  email: string
  role: string
  avatarUrl: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then(data => {
        setUser({
          id: data.id as string,
          username: data.username as string,
          email: data.email as string,
          role: data.role as string,
          avatarUrl: (data.avatarUrl as string) ?? null,
        })
      })
      .catch(() => {
        setAuthToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password })
    setAuthToken(data.token)
    setUser({
      id: data.user.id as string,
      username: data.user.username as string,
      email: data.user.email as string,
      role: (data.user.role as string) ?? 'user',
      avatarUrl: null,
    })
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const data = await api.register({ username, email, password })
    setAuthToken(data.token)
    setUser({
      id: data.user.id as string,
      username: data.user.username as string,
      email: data.user.email as string,
      role: 'user',
      avatarUrl: null,
    })
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
