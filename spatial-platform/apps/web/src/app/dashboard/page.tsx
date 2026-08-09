'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--accent)]">Spatial Platform</h1>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm px-3 py-1.5 rounded bg-[var(--muted)] hover:text-[var(--accent)] transition-colors">Dashboard</a>
          {user.role === 'admin' && (
            <a href="/admin" className="text-sm px-3 py-1.5 rounded bg-[var(--muted)] hover:text-[var(--accent)] transition-colors">
              Admin
            </a>
          )}
          <span className="text-sm text-[var(--foreground)]">{user.username}</span>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded bg-[var(--muted)] hover:bg-red-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <a
            href="/worlds"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Worlds</h2>
            <p className="text-sm text-gray-400">Explore and create 3D worlds</p>
          </a>
          <a
            href="/marketplace"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Marketplace</h2>
            <p className="text-sm text-gray-400">Browse and sell assets</p>
          </a>
          <a
            href="/studio/new"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Studio</h2>
            <p className="text-sm text-gray-400">Build worlds with Babylon.js</p>
          </a>
          <a
            href="/careers"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Careers</h2>
            <p className="text-sm text-gray-400">Join the team</p>
          </a>
          <a
            href="/"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Home</h2>
            <p className="text-sm text-gray-400">Return to the start</p>
          </a>
          <a
            href="/login"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Login</h2>
            <p className="text-sm text-gray-400">Sign in to continue</p>
          </a>
          <a
            href="/admin"
            className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">Admin</h2>
            <p className="text-sm text-gray-400">Platform administration</p>
          </a>
        </div>
      </main>
    </div>
  )
}
