'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { logger } from '@/lib/logger';

type WorkspaceInfo = {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

function DownloadInner() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [info, setInfo] = useState<WorkspaceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push(`/public-pages/auth?redirectTo=/my-workspace/${workspaceId}/download`); return }

    fetch(`/api/user-workspace/${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (data.workspace) {
          setInfo(data.workspace)
        } else {
          router.push('/my-workspace')
        }
        setLoading(false)
      })
      .catch(() => { setLoading(false); router.push('/my-workspace') })
  }, [workspaceId, user, authLoading, router])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const r = await fetch(`/api/user-workspace/${workspaceId}/export`)
      if (!r.ok) throw new Error('Export failed')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${info?.name || 'workspace'}-workspace.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Download failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href={`/my-workspace/${workspaceId}/edit`} className="text-xs text-white/40 hover:text-white transition mb-6 inline-block">
          ← Back to Editor
        </Link>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950 to-black p-8 text-center">
          <p className="text-5xl mb-4">📦</p>
          <h1 className="text-2xl font-extrabold mb-2">Download & Install</h1>
          <p className="text-sm text-white/50 mb-2 max-w-md mx-auto">
            Download your workspace <strong className="text-white">{info?.name}</strong> as a standalone package.
          </p>
          <p className="text-xs text-white/30 mb-8">
            Created {info?.created_at ? new Date(info.created_at).toLocaleDateString() : '—'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-6 text-left">
              <p className="text-sm font-semibold text-indigo-300 mb-1">📦 Workspace ZIP</p>
              <p className="text-xs text-white/50 mb-4">
                Complete workspace package with standalone 3D viewer. 
                Open index.html in any browser — no server needed.
              </p>
              <ul className="text-xs text-white/40 space-y-1 mb-4">
                <li>✓ Standalone HTML viewer</li>
                <li>✓ Scene data (JSON)</li>
                <li>✓ Export to GLB</li>
                <li>✓ Works offline</li>
              </ul>
              <button onClick={handleDownload} disabled={downloading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-semibold transition">
                {downloading ? 'Packaging...' : '⬇ Download ZIP'}
              </button>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-6 text-left">
              <p className="text-sm font-semibold text-cyan-300 mb-1">🌐 Open in Browser</p>
              <p className="text-xs text-white/50 mb-4">
                No download needed — continue editing online. 
                Your workspace is saved in the cloud.
              </p>
              <ul className="text-xs text-white/40 space-y-1 mb-4">
                <li>✓ Real-time 3D editing</li>
                <li>✓ Auto-save enabled</li>
                <li>✓ Add objects & materials</li>
                <li>✓ Export when ready</li>
              </ul>
              <Link href={`/my-workspace/${workspaceId}/edit`}
                className="block w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold text-center transition">
                🎮 Open Editor
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-left">
            <p className="text-xs font-semibold text-white/60 mb-2">💡 How to install locally</p>
            <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
              <li>Download the ZIP package above</li>
              <li>Extract to any folder on your computer</li>
              <li>Double-click <code className="text-cyan-400 bg-cyan-900/20 px-1 rounded">index.html</code> to open the 3D viewer</li>
              <li>Click <strong>Export GLB</strong> to download a 3D model file</li>
              <li>Import the GLB into any 3D software (Blender, Unity, etc.)</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <DownloadInner />
    </Suspense>
  )
}
