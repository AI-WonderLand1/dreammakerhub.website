'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Renderer, SceneManager, createMesh, type AnimationClip, playClip } from '@spatial/engine-core'
import type { SceneObject, SceneLight } from '@spatial/core'

const PRIMITIVES = ['box', 'sphere', 'plane', 'cylinder', 'torus', 'capsule'] as const

export default function StudioPage() {
  const params = useParams()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [objects, setObjects] = useState<SceneObject[]>([])
  const [showPanel, setShowPanel] = useState(true)

  const addObject = useCallback((type: string) => {
    const obj: SceneObject = {
      id: crypto.randomUUID(),
      name: `${type}_${objects.length + 1}`,
      type,
      position: [0, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      meshUrl: null,
      material: { color: [0.5, 0.5, 0.5], metallic: 0, roughness: 0.5, emissive: null, opacity: 1 },
      physics: null,
      scripts: [],
      children: [],
    }
    setObjects(prev => [...prev, obj])
  }, [objects.length])

  useEffect(() => {
    if (!canvasRef.current) return

    let r: Renderer | null = null
    let sm: SceneManager | null = null
    let destroyed = false

    const init = async () => {
      r = await Renderer.create(canvasRef.current!, { antialias: true, preferWebGPU: true })
      sm = new SceneManager(r.engine)
      sm.addGround(50, 50)
      sm.addSkybox({ color: [0.3, 0.5, 0.8], type: 'gradient', cubemapUrl: null })
      sm.loadLights([])
      sm.setupCamera({ position: [8, 6, 8], target: [0, 0, 0], fov: 60, near: 0.1, far: 1000 })

      r.runRenderLoop(() => {
        if (!destroyed) sm!.scene.render()
      })

      setSceneManager(sm)

      const handleResize = () => r?.resize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    init()

    return () => {
      destroyed = true
      r?.stopRenderLoop()
      sm?.dispose()
      r?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!sceneManager) return
    sceneManager.loadObjects(objects)
  }, [objects, sceneManager])

  return (
    <div className="h-screen flex">
      {showPanel && (
        <aside className="w-64 border-r border-[var(--border)] bg-[var(--background)] overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold mb-3">Objects</h2>
            <div className="grid grid-cols-2 gap-2">
              {PRIMITIVES.map(type => (
                <button
                  key={type}
                  onClick={() => addObject(type)}
                  className="px-3 py-2 text-xs bg-[var(--muted)] hover:bg-[var(--accent)] rounded transition-colors capitalize"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Scene Objects</h3>
            {objects.length === 0 ? (
              <p className="text-xs text-gray-500">No objects yet. Add one above.</p>
            ) : (
              <div className="space-y-1">
                {objects.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObject(obj.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                      selectedObject === obj.id
                        ? 'bg-[var(--accent)] text-white'
                        : 'hover:bg-[var(--muted)]'
                    }`}
                  >
                    {obj.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full outline-none" />

        <div className="absolute top-3 left-3">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="px-3 py-1.5 text-xs bg-[var(--muted)] hover:bg-[var(--accent)] rounded transition-colors"
          >
            {showPanel ? 'Hide Panel' : 'Show Panel'}
          </button>
        </div>
      </div>
    </div>
  )
}
