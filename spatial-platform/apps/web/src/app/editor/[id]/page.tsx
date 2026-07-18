'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Renderer, SceneManager } from '@spatial/engine-core'
import type { SceneData, World } from '@spatial/core'

export default function EditorPage() {
  const params = useParams()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [world, setWorld] = useState<World | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = params.id as string
    if (!id) return

    api.get<World>(`/api/worlds/${id}`)
      .then(setWorld)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    if (!canvasRef.current || !world) return

    let renderer: Renderer | null = null
    let sceneManager: SceneManager | null = null
    let destroyed = false

    const init = async () => {
      renderer = await Renderer.create(canvasRef.current!, {
        antialias: true,
        preferWebGPU: true,
      })

      sceneManager = new SceneManager(renderer.engine)

      const sceneData = (world.sceneData ?? {
        version: 1,
        objects: [],
        lights: [],
        camera: { position: [0, 5, 10], target: [0, 0, 0], fov: 60, near: 0.1, far: 1000 },
        sky: null,
        scripts: [],
      }) as SceneData

      sceneManager.addGround(50, 50)
      sceneManager.addSkybox(sceneData.sky ?? undefined)
      sceneManager.loadObjects((sceneData as any).objects ?? [])
      sceneManager.loadLights((sceneData as any).lights ?? [])
      sceneManager.setupCamera(sceneData.camera)

      renderer.runRenderLoop(() => {
        if (!destroyed) {
          sceneManager!.scene.render()
        }
      })

      const handleResize = () => renderer?.resize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    init()

    return () => {
      destroyed = true
      renderer?.stopRenderLoop()
      sceneManager?.dispose()
      renderer?.dispose()
    }
  }, [world])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading world...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/worlds" className="text-[var(--accent)] hover:underline">&larr; Back to worlds</a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-4 py-2 flex items-center justify-between bg-[var(--background)] z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr;</a>
          <h1 className="font-semibold text-sm">{world?.name ?? 'Editor'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">FPS: --</span>
        </div>
      </header>
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full outline-none" />
      </div>
    </div>
  )
}
