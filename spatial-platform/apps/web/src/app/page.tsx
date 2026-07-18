'use client'

import { useEffect, useState } from 'react'
import { api, setAuthToken, getAuthToken, isAuthenticated } from '@/lib/api'

export default function HomePage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getAuthToken()) {
      api.me().then(setUser).catch(() => setAuthToken(null))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const fn = isRegister ? api.register : api.login
      const data = isRegister
        ? await fn({ username, email, password })
        : await fn({ email, password })
      setAuthToken(data.token)
      setUser(data.user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    setUser(null)
  }

  if (user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--accent)]">Spatial Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--foreground)]">
              {user.username as string}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <a href="/worlds" className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors">
              <h2 className="text-lg font-semibold mb-2">Worlds</h2>
              <p className="text-sm text-gray-400">Explore and create 3D worlds</p>
            </a>
            <a href="/marketplace" className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors">
              <h2 className="text-lg font-semibold mb-2">Marketplace</h2>
              <p className="text-sm text-gray-400">Browse and sell assets</p>
            </a>
            <a href="/studio/new" className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors">
              <h2 className="text-lg font-semibold mb-2">Studio</h2>
              <p className="text-sm text-gray-400">Build worlds with Babylon.js</p>
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold text-center text-[var(--accent)]">
          Spatial Platform
        </h1>
        <p className="text-sm text-center text-gray-400">
          {isRegister ? 'Create an account' : 'Sign in to continue'}
        </p>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3">
            {error}
          </div>
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button
          type="submit"
          className="w-full py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded font-medium transition-colors"
        >
          {isRegister ? 'Register' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
      </form>
    </div>
  )
}
