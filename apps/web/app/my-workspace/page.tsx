'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { logger } from '@/lib/logger';

type Workspace = {
  id: string
  name: string
  description: string
  thumbnail: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function MyWorkspacePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/public-pages/auth?redirectTo=/my-workspace'); return }

    fetch('/api/user-workspace')
      .then(r => r.json())
      .then(data => {
        setWorkspaces(data.workspaces || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user, authLoading, router])

  const createWorkspace = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const r = await fetch('/api/user-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await r.json()
      if (data.workspace?.id) {
        router.push(`/my-workspace/${data.workspace.id}/edit`)
      }
    } finally {
      setCreating(false)
    }
  }

  const deleteWorkspace = async (id: string) => {
    if (!confirm('Delete this workspace permanently?')) return
    await fetch(`/api/user-workspace/${id}`, { method: 'DELETE' })
    setWorkspaces(prev => prev.filter(w => w.id !== id))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">My Workspace</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Your 3D Workspaces</h1>
          </div>
          <Link href="/dashboard/projects" className="text-xs text-white/40 hover:text-white transition">
            ← Dashboard
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Create New Workspace</h2>
          <div className="flex gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="My 3D World" maxLength={80}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 transition"
              onKeyDown={e => e.key === 'Enter' && createWorkspace()} />
            <button onClick={createWorkspace} disabled={creating || !newName.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-semibold transition">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {workspaces.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <p className="text-4xl mb-4">🌌</p>
            <p className="text-white/50">No workspaces yet. Create one to start building in 3D.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map(w => (
              <div key={w.id} className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-indigo-500/30 transition">
                <Link href={`/my-workspace/${w.id}/edit`} className="block p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🎮</span>
                    <h3 className="font-semibold text-white truncate">{w.name}</h3>
                  </div>
                  {w.description && <p className="text-xs text-white/50 mb-3 line-clamp-2">{w.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <span>{new Date(w.updated_at || w.created_at).toLocaleDateString()}</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${w.is_public ? 'bg-green-900/40 text-green-400' : 'bg-white/5 text-white/30'}`}>
                      {w.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </Link>
                <div className="flex border-t border-white/5">
                  <Link href={`/my-workspace/${w.id}/edit`}
                    className="flex-1 text-center py-2 text-xs text-white/40 hover:text-indigo-400 hover:bg-white/5 transition">
                    Open Editor
                  </Link>
                  <Link href={`/my-workspace/${w.id}/download`}
                    className="flex-1 text-center py-2 text-xs text-white/40 hover:text-cyan-400 hover:bg-white/5 transition border-l border-white/5">
                    Download
                  </Link>
                  <button onClick={() => deleteWorkspace(w.id)}
                    className="flex-1 text-center py-2 text-xs text-white/30 hover:text-red-400 hover:bg-white/5 transition border-l border-white/5">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
