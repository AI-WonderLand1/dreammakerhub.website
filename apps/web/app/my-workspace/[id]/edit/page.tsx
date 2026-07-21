'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/supabase/auth-context'
import { logger } from '@/lib/logger';

const WorkspaceEditor3D = dynamic(() => import('@/components/workspace/WorkspaceEditor3D'), { ssr: false })

type SceneData = {
  objects: unknown[]
  lights: unknown[]
  camera: { position: [number, number, number]; target: [number, number, number]; fov: number }
  skybox: unknown
}

function EditorInner() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [name, setName] = useState('Loading...')
  const [sceneData, setSceneData] = useState<SceneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push(`/public-pages/auth?redirectTo=/my-workspace/${workspaceId}/edit`); return }

    fetch(`/api/user-workspace/${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (data.workspace) {
          setName(data.workspace.name)
          setSceneData(data.workspace.data || null)
        } else {
          router.push('/my-workspace')
        }
        setLoading(false)
      })
      .catch(() => { setLoading(false); router.push('/my-workspace') })
  }, [workspaceId, user, authLoading, router])

  const handleSave = useCallback(async (data: SceneData) => {
    setSaveStatus('saving')
    try {
      await fetch(`/api/user-workspace/${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      setSaveStatus('saved')
    } catch { setSaveStatus('idle') }
  }, [workspaceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/my-workspace" className="text-xs text-white/40 hover:text-white transition">← My Workspaces</Link>
          <span className="text-white/20">/</span>
          <input value={name} onChange={e => setName(e.target.value)}
            className="bg-transparent text-sm font-medium text-white border-b border-transparent focus:border-indigo-500 outline-none"
            onBlur={() => fetch(`/api/user-workspace/${workspaceId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name }),
            })} />
          <span className={`text-[10px] ${saveStatus === 'saved' ? 'text-green-400' : 'text-white/20'}`}>
            {saveStatus === 'saving' ? 'saving...' : saveStatus === 'saved' ? 'saved ✓' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/my-workspace/${workspaceId}/download`}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-cyan-600/20 border border-white/10 rounded-lg transition">
            ⬇ Download
          </Link>
          <button onClick={() => handleSave(sceneData!)}
            className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition">
            Save Now
          </button>
        </div>
      </header>

      <div className="flex-1 p-3">
        <WorkspaceEditor3D
          workspaceId={workspaceId}
          initialData={sceneData || undefined}
          onSave={handleSave}
        />
      </div>

      <footer className="px-6 py-2 border-t border-white/5 text-[10px] text-white/20 flex items-center justify-between">
        <span>Click + to add objects · Select an object to edit · Drag to orbit</span>
        <span>{workspaceId.slice(0, 8)}</span>
      </footer>
    </main>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <EditorInner />
    </Suspense>
  )
}
