'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Renderer, SceneManager } from '@spatial/engine-core'
import type { SceneObject } from '@spatial/core'
import { useBabylonGesture } from '@/hooks/useBabylonGesture'

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

  const gesture = useBabylonGesture(
    canvasRef,
    sceneManager,
    selectedObject,
    { targetType: selectedObject ? 'mesh' : 'camera' }
  )

  return (
    <div className="h-screen flex">
      <header className="border-b border-[var(--border)] px-4 py-2 flex items-center justify-between bg-[var(--background)] z-10">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-[var(--accent)] hover:underline text-sm">Dashboard</a>
          <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr;</a>
          <h1 className="font-semibold text-sm">Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">FPS: --</span>
        </div>
      </header>
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

          <div className="p-4 border-t border-[var(--border)] space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Gesture</h3>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={gesture.settings.enabled}
                onChange={e => gesture.updateSettings({ enabled: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              Enabled
            </label>

            <div>
              <label className="text-[10px] text-gray-500">Sensitivity: {gesture.settings.sensitivity.toFixed(1)}</label>
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.1"
                value={gesture.settings.sensitivity}
                onChange={e => gesture.updateSettings({ sensitivity: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500">Smoothing: {gesture.settings.smoothing.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="0.99"
                step="0.01"
                value={gesture.settings.smoothing}
                onChange={e => gesture.updateSettings({ smoothing: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div className="text-[10px] text-gray-500">
              Target: {selectedObject ? 'selected mesh' : 'camera'}
            </div>
          </div>
        </aside>
      )}

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full outline-none" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="px-3 py-1.5 text-xs bg-[var(--muted)] hover:bg-[var(--accent)] rounded transition-colors"
          >
            {showPanel ? 'Hide Panel' : 'Show Panel'}
          </button>
          <div className={`px-2 py-1 text-[10px] rounded ${
            gesture.connected ? (gesture.active ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400') : 'bg-red-900 text-red-300'
          }`}>
            {gesture.connected ? (gesture.active ? `${gesture.gesture} (${(gesture.confidence * 100).toFixed(0)}%)` : 'idle') : 'no gesture'}
          </div>
        </div>
      </div>
    </div>
  )
}
