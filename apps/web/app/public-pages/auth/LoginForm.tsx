'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ensureSupabaseConfig, getSupabaseClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

function sanitizeRedirectPath(raw: string | null) {
  if (!raw) return '/wonder-build'
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/wonder-build'
  }
  return trimmed
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleLogin = async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const config = await ensureSupabaseConfig()
      const supabase = config ? getSupabaseClient() : null

      if (!supabase) {
        logger.error('Supabase not configured')
        setErrorMessage('Authentication service is temporarily unavailable. Please try again.')
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error('Login error', { error: error.message })
        setErrorMessage(error.message)
        return
      }

      if (data.session) {
        const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'))
        router.push(redirectTo)
        router.refresh()
      }
    } catch (error) {
      logger.error('Unexpected login error', { error })
      setErrorMessage('Unable to reach the authentication service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </div>
  )
}
