'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface World {
  id: string
  name: string
  description: string
  visibility: string
  thumbnailUrl: string | null
  ownerId: string
  createdAt: string
}

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ data: World[] }>('/api/worlds')
      .then(res => setWorlds(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr; Home</a>
        <h1 className="text-xl font-bold mt-2">Worlds</h1>
      </header>

      <main className="p-6">
        <a
          href="/studio/new"
          className="inline-block mb-6 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-sm font-medium transition-colors"
        >
          Create New World
        </a>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : worlds.length === 0 ? (
          <p className="text-gray-400">No worlds yet. Create the first one!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {worlds.map(world => (
              <a
                key={world.id}
                href={`/editor/${world.id}`}
                className="block p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--accent)] transition-colors"
              >
                {world.thumbnailUrl && (
                  <img
                    src={world.thumbnailUrl}
                    alt={world.name}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}
                <h2 className="font-semibold">{world.name}</h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {world.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span className="capitalize">{world.visibility}</span>
                  <span>&middot;</span>
                  <span>{new Date(world.createdAt).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
