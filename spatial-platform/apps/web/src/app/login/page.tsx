'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login, register, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    router.replace('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isRegister) {
        await register(username, email, password)
      } else {
        await login(email, password)
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8">
        <div className="mt-4 flex items-center justify-center gap-4">
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</a>
          <a href="/login" className="text-sm px-4 py-1.5 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors">Sign In</a>
        </div>

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
            className="w-full"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full"
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded font-medium transition-colors"
        >
          {busy ? 'Please wait...' : isRegister ? 'Register' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={() => { setIsRegister(!isRegister); setError('') }}
          className="w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
      </form>
    </div>
  )
}
