'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([
      api.get<{ total: number }>('/api/worlds').catch(() => ({ total: 0 })),
      api.get<{ data: unknown[] }>('/api/marketplace/listings').catch(() => ({ data: [] })),
    ]).then(([worlds, listings]) => {
      setStats({
        worlds: worlds.total,
        listings: listings.data.length,
      })
    })
  }, [])

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr; Home</a>
        <h1 className="text-xl font-bold mt-2">Admin</h1>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
            <div className="text-xs text-gray-400 uppercase">Worlds</div>
            <div className="text-2xl font-bold mt-1">{stats.worlds ?? '...'}</div>
          </div>
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
            <div className="text-xs text-gray-400 uppercase">Listings</div>
            <div className="text-2xl font-bold mt-1">{stats.listings ?? '...'}</div>
          </div>
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
            <div className="text-xs text-gray-400 uppercase">Health</div>
            <div className="text-2xl font-bold mt-1 text-green-400">OK</div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3">Management</h2>
          <div className="space-y-2">
            <a href="/worlds" className="block px-4 py-3 rounded border border-[var(--border)] hover:border-[var(--accent)] text-sm transition-colors">
              Manage Worlds
            </a>
            <a href="/marketplace" className="block px-4 py-3 rounded border border-[var(--border)] hover:border-[var(--accent)] text-sm transition-colors">
              Manage Marketplace
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
