'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Listing {
  id: string
  asset_id: string
  asset_name: string
  asset_type: string
  price: number
  currency: string
  status: string
  tags: string[]
  created_at: string
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const q = filter ? `?assetType=${filter}` : ''
    api.get<{ data: Listing[] }>(`/api/marketplace/listings${q}`)
      .then(res => setListings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr; Home</a>
          <a href="/dashboard" className="text-[var(--accent)] hover:underline text-sm">Dashboard</a>
        </div>
        <h1 className="text-xl font-bold mt-2">Marketplace</h1>
      </header>

      <main className="p-6">
        <div className="flex gap-2 mb-6">
          {['', 'model', 'texture', 'script', 'plugin'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                filter === type
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--muted)] hover:bg-[var(--accent)]'
              }`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="text-gray-400">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]"
              >
                <div className="text-xs text-gray-500 uppercase mb-1">{item.asset_type}</div>
                <h3 className="font-semibold mb-1">{item.asset_name}</h3>
                <div className="text-lg font-bold text-[var(--accent)]">
                  {item.price} {item.currency}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags?.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-gray-800 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="mt-3 w-full px-3 py-2 text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors">
                  Purchase
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
