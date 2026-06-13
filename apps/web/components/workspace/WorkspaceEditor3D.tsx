'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type SceneObject = {
  id: string
  name: string
  meshType: 'box' | 'sphere' | 'cylinder' | 'plane' | 'torus'
  parameters: Record<string, number>
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: [number, number, number]
  metalness: number
  roughness: number
}

type SceneLight = {
  id: string
  type: 'directional' | 'ambient' | 'point'
  color: [number, number, number]
  intensity: number
  direction?: [number, number, number]
  position?: [number, number, number]
}

type SceneData = {
  objects: SceneObject[]
  lights: SceneLight[]
  camera: { position: [number, number, number]; target: [number, number, number]; fov: number }
  skybox: unknown
}

const PRIMITIVES = [
  { type: 'box' as const, label: 'Box', icon: '📦', params: { width: 1, height: 1, depth: 1 } },
  { type: 'sphere' as const, label: 'Sphere', icon: '⚪', params: { radius: 0.5 } },
  { type: 'cylinder' as const, label: 'Cylinder', icon: '🛢️', params: { radiusTop: 0.5, radiusBottom: 0.5, height: 1 } },
  { type: 'plane' as const, label: 'Plane', icon: '📐', params: { width: 1, height: 1 } },
  { type: 'torus' as const, label: 'Torus', icon: '🍩', params: { radius: 0.5, tube: 0.2 } },
]

function generateId() {
  return `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0.3, 0.5, 1]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  return `#${to255(r)}${to255(g)}${to255(b)}`
}

interface WorkspaceEditor3DProps {
  workspaceId: string
  initialData?: SceneData
  onSave: (data: SceneData) => void
}

export default function WorkspaceEditor3D({ workspaceId, initialData, onSave }: WorkspaceEditor3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<any>(null)
  const pcRef = useRef<any>(null)
  const entitiesRef = useRef<Map<string, any>>(new Map())
  const [pcLoaded, setPcLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [objects, setObjects] = useState<SceneObject[]>(initialData?.objects || [])
  const [lights] = useState<SceneLight[]>(initialData?.lights || [
    { id: 'light-1', type: 'directional', color: [1, 1, 1], intensity: 1, direction: [0.5, -1, -0.5] },
    { id: 'light-2', type: 'ambient', color: [0.4, 0.4, 0.5], intensity: 0.6 },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const selectedObj = objects.find(o => o.id === selectedId)

  const getSceneData = useCallback((): SceneData => ({
    objects,
    lights,
    camera: { position: [0, 3, 8], target: [0, 0, 0], fov: 45 },
    skybox: null,
  }), [objects, lights])

  const syncSceneToPlayCanvas = useCallback((pc: any, app: any, objs: SceneObject[]) => {
    const currentIds = new Set(entitiesRef.current.keys())
    const newIds = new Set(objs.map(o => o.id))

    for (const id of currentIds) {
      if (!newIds.has(id)) {
        const entity = entitiesRef.current.get(id)
        if (entity) {
          app.root.removeChild(entity)
          entity.destroy?.()
        }
        entitiesRef.current.delete(id)
      }
    }

    for (const obj of objs) {
      let entity = entitiesRef.current.get(obj.id)
      if (!entity) {
        entity = new pc.Entity(obj.name)
        entity.addComponent('render', { type: obj.meshType === 'sphere' ? 'sphere' : obj.meshType === 'plane' ? 'plane' : 'box' })
        const material = new pc.StandardMaterial()
        material.diffuse = new pc.Color(obj.color[0], obj.color[1], obj.color[2])
        material.metalness = obj.metalness
        material.useMetalness = true
        material.roughness = obj.roughness
        material.update()
        if (entity.render) entity.render.material = material
        app.root.addChild(entity)
        entitiesRef.current.set(obj.id, entity)
      }
      entity.setPosition(obj.position[0], obj.position[1], obj.position[2])
      entity.setEulerAngles(obj.rotation[0], obj.rotation[1], obj.rotation[2])
      entity.setLocalScale(obj.scale[0], obj.scale[1], obj.scale[2])
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    let mounted = true

    const init = async () => {
      try {
        const playcanvas = await import('playcanvas')
        if (!mounted || !canvasRef.current) return

        const pc = playcanvas
        pcRef.current = pc
        const canvas = canvasRef.current
        const app = new pc.Application(canvas, {
          mouse: new pc.Mouse(canvas),
          touch: new pc.TouchDevice(canvas),
          elementInput: new pc.ElementInput(canvas),
        })
        appRef.current = app
        app.start()

        const resize = () => {
          if (containerRef.current && canvas) {
            const rect = containerRef.current.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
            app.resizeCanvas(rect.width, rect.height)
          }
        }
        resize()
        window.addEventListener('resize', resize)

        const camera = new pc.Entity('Camera')
        camera.addComponent('camera', { clearColor: new pc.Color(0.08, 0.08, 0.14), fov: 45, nearClip: 0.1, farClip: 1000 })
        camera.setPosition(0, 3, 8)
        camera.lookAt(0, 0, 0)
        app.root.addChild(camera)

        const dLight = new pc.Entity('DirLight')
        dLight.addComponent('light', { type: 'directional', color: new pc.Color(1, 1, 1), intensity: 1, castShadows: true })
        dLight.setEulerAngles(45, 30, 0)
        app.root.addChild(dLight)

        const aLight = new pc.Entity('AmbLight')
        aLight.addComponent('light', { type: 'point', color: new pc.Color(0.4, 0.4, 0.5), intensity: 0.6, range: 100 })
        aLight.setPosition(5, 10, 5)
        app.root.addChild(aLight)

        const ground = new pc.Entity('Ground')
        ground.addComponent('render', { type: 'plane' })
        ground.setLocalScale(20, 1, 20)
        ground.setPosition(0, -0.5, 0)
        const gm = new pc.StandardMaterial()
        gm.diffuse = new pc.Color(0.12, 0.12, 0.2)
        gm.update()
        if (ground.render) ground.render.material = gm
        app.root.addChild(ground)

        let isDragging = false, lx = 0, ly = 0
        let dist = 8, az = 45, el = 30
        app.mouse.on(pc.EVENT_MOUSEDOWN, (e: any) => { if (e.button === pc.MOUSEBUTTON_LEFT) { isDragging = true; lx = e.x; ly = e.y } })
        app.mouse.on(pc.EVENT_MOUSEUP, () => { isDragging = false })
        app.mouse.on(pc.EVENT_MOUSEMOVE, (e: any) => {
          if (!isDragging) return
          az -= (e.x - lx) * 0.3
          el = Math.max(5, Math.min(85, el - (e.y - ly) * 0.3))
          lx = e.x; ly = e.y
          const phi = el * pc.math.DEG_TO_RAD, theta = az * pc.math.DEG_TO_RAD
          camera.setPosition(dist * Math.sin(phi) * Math.sin(theta), dist * Math.cos(phi), dist * Math.sin(phi) * Math.cos(theta))
          camera.lookAt(0, 0, 0)
        })
        app.mouse.on(pc.EVENT_MOUSEWHEEL, (e: any) => {
          dist = Math.max(2, Math.min(50, dist - e.wheel * 0.5))
          const phi = el * pc.math.DEG_TO_RAD, theta = az * pc.math.DEG_TO_RAD
          camera.setPosition(dist * Math.sin(phi) * Math.sin(theta), dist * Math.cos(phi), dist * Math.sin(phi) * Math.cos(theta))
          camera.lookAt(0, 0, 0)
        })

        setPcLoaded(true)
        syncSceneToPlayCanvas(pc, app, objects)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load 3D engine')
      }
    }
    init()
    return () => { mounted = false; if (appRef.current) { appRef.current.destroy(); appRef.current = null } }
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pcLoaded && pcRef.current && appRef.current) {
      syncSceneToPlayCanvas(pcRef.current, appRef.current, objects)
    }
  }, [objects, pcLoaded, syncSceneToPlayCanvas])

  const addObject = useCallback((type: SceneObject['meshType']) => {
    const preset = PRIMITIVES.find(p => p.type === type)
    const newObj: SceneObject = {
      id: generateId(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
      meshType: type,
      parameters: preset?.params || {},
      position: [0, 0.5 + objects.length * 0.3, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: [0.3, 0.5, 1],
      metalness: 0.3,
      roughness: 0.6,
    }
    setObjects(prev => [...prev, newObj])
    setSelectedId(newObj.id)
  }, [objects])

  const updateObject = useCallback((id: string, partial: Partial<SceneObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...partial } : o))
  }, [])

  const deleteObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    if (objects.length === 0 && !initialData?.objects?.length) return
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saving')
      onSave(getSceneData())
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }, 2000)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [objects]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-red-500/10 rounded-xl border border-red-500/30 p-8">
        <div className="text-center">
          <p className="text-red-400 font-bold text-lg mb-2">Failed to load 3D Engine</p>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-black rounded-xl">
      {!pcLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-indigo-400 text-sm">Loading 3D Workspace...</p>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 z-20 text-xs">
        <span className="text-white/40">Workspace:</span>
        <span className="text-white font-medium">{workspaceId.slice(0, 8)}...</span>
        <span className="w-px h-4 bg-white/10 mx-1" />
        <span className={`${autoSaveStatus === 'saved' ? 'text-green-400' : autoSaveStatus === 'saving' ? 'text-yellow-400' : 'text-white/30'}`}>
          {autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Saved ✓' : 'Auto-save'}
        </span>
      </div>

      <div className="absolute right-3 top-3 z-20 flex gap-1.5">
        {PRIMITIVES.map(p => (
          <button key={p.type} onClick={() => addObject(p.type)}
            className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-indigo-600/40 border border-white/10 rounded text-xs transition"
            title={`Add ${p.label}`}>{p.icon}</button>
        ))}
      </div>

      {selectedObj && (
        <div className="absolute left-3 bottom-3 z-20 bg-black/80 backdrop-blur border border-white/10 rounded-xl p-4 w-64 space-y-3">
          <div className="flex items-center justify-between">
            <input value={selectedObj.name} onChange={e => updateObject(selectedObj.id, { name: e.target.value })}
              className="bg-transparent text-white font-medium text-sm border-b border-white/20 focus:border-indigo-400 outline-none w-full mr-2" />
            <button onClick={() => deleteObject(selectedObj.id)} className="text-red-400 hover:text-red-300 text-xs shrink-0">✕</button>
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Color</label>
            <input type="color" value={rgbToHex(...selectedObj.color)} onChange={e => updateObject(selectedObj.id, { color: hexToRgb(e.target.value) })}
              className="w-full h-7 rounded cursor-pointer bg-transparent" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Slider label="X" value={selectedObj.position[0]} min={-5} max={5} step={0.1}
              onChange={v => updateObject(selectedObj.id, { position: [v, selectedObj.position[1], selectedObj.position[2]] })} />
            <Slider label="Y" value={selectedObj.position[1]} min={-5} max={5} step={0.1}
              onChange={v => updateObject(selectedObj.id, { position: [selectedObj.position[0], v, selectedObj.position[2]] })} />
            <Slider label="Z" value={selectedObj.position[2]} min={-5} max={5} step={0.1}
              onChange={v => updateObject(selectedObj.id, { position: [selectedObj.position[0], selectedObj.position[1], v] })} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Slider label="RX" value={selectedObj.rotation[0]} min={-180} max={180} step={1}
              onChange={v => updateObject(selectedObj.id, { rotation: [v, selectedObj.rotation[1], selectedObj.rotation[2]] })} />
            <Slider label="RY" value={selectedObj.rotation[1]} min={-180} max={180} step={1}
              onChange={v => updateObject(selectedObj.id, { rotation: [selectedObj.rotation[0], v, selectedObj.rotation[2]] })} />
            <Slider label="RZ" value={selectedObj.rotation[2]} min={-180} max={180} step={1}
              onChange={v => updateObject(selectedObj.id, { rotation: [selectedObj.rotation[0], selectedObj.rotation[1], v] })} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Slider label="SX" value={selectedObj.scale[0]} min={0.1} max={5} step={0.1}
              onChange={v => updateObject(selectedObj.id, { scale: [v, selectedObj.scale[1], selectedObj.scale[2]] })} />
            <Slider label="SY" value={selectedObj.scale[1]} min={0.1} max={5} step={0.1}
              onChange={v => updateObject(selectedObj.id, { scale: [selectedObj.scale[0], v, selectedObj.scale[2]] })} />
            <Slider label="SZ" value={selectedObj.scale[2]} min={0.1} max={5} step={0.1}
              onChange={v => updateObject(selectedObj.id, { scale: [selectedObj.scale[0], selectedObj.scale[1], v] })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Slider label="Metal" value={selectedObj.metalness} min={0} max={1} step={0.05}
              onChange={v => updateObject(selectedObj.id, { metalness: v })} />
            <Slider label="Rough" value={selectedObj.roughness} min={0} max={1} step={0.05}
              onChange={v => updateObject(selectedObj.id, { roughness: v })} />
          </div>
        </div>
      )}

      <div className="absolute left-3 top-3 z-20 bg-black/60 backdrop-blur border border-white/10 rounded-lg p-2 max-h-60 overflow-y-auto w-40">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 px-1">Scene Objects</p>
        {objects.length === 0 && <p className="text-[11px] text-white/20 px-1">No objects yet. Click + to add.</p>}
        {objects.map(obj => (
          <button key={obj.id} onClick={() => setSelectedId(obj.id)}
            className={`w-full text-left px-2 py-1 rounded text-xs transition flex items-center gap-1.5 ${
              selectedId === obj.id ? 'bg-indigo-600/30 text-indigo-300' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}>
            <span>{PRIMITIVES.find(p => p.type === obj.meshType)?.icon || '📦'}</span>
            <span className="truncate">{obj.name}</span>
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: 'none' }} />
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-white/30 uppercase">{label}</span>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-indigo-500 cursor-pointer" />
      <span className="text-[10px] text-white/50 text-center">{value.toFixed(step < 0.1 ? 2 : 1)}</span>
    </div>
  )
}
