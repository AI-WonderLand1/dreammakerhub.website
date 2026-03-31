'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@lib/supabase/client'
import { logger } from '@lib/logger'

export default function LoginForm() {
  const supabase = getSupabaseClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleLogin = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.error('Login error', { error: error.message })
      setLoading(false)
      return
    }

    if (data.session) {
      // Set cookies manually so middleware can read them
      document.cookie = `sb-access-token=${data.session.access_token}; path=/`
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/`

      const redirectTo = searchParams.get('redirectTo') || '/wonder-build'
      router.push(redirectTo)
    }

    setLoading(false)
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
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </div>
  )
}
