'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    router.replace('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-[var(--accent)]">Spatial Platform</span>
        <div className="flex items-center gap-3">
          <a href="/careers" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</a>
          <a
            href="/login"
            className="text-sm px-4 py-1.5 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
          >
            Sign In
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold max-w-2xl leading-tight">
          Build, explore, and share
          <span className="text-[var(--accent)]"> 3D worlds</span>
        </h1>
        <p className="text-gray-400 mt-4 max-w-lg text-sm sm:text-base">
          A spatial computing platform with a built-in Babylon.js editor, AI-powered NPCs,
          multiplayer, and a marketplace for 3D assets.
        </p>
        <div className="flex items-center gap-3 mt-8">
          <a
            href="/login"
            className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded font-medium transition-colors"
          >
            Get Started
          </a>
          <a
            href="/careers"
            className="px-6 py-2.5 border border-[var(--border)] hover:border-[var(--accent)] rounded font-medium transition-colors"
          >
            We&apos;re Hiring
          </a>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Spatial Platform. All rights reserved.
      </footer>
    </div>
  )
}
