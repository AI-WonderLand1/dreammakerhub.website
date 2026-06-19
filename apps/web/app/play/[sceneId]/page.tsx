"use client"

import { useEffect, useState, useRef } from "react"
import * as pc from "playcanvas"
import Link from "next/link"
import { History, RotateCcw } from "lucide-react"

interface Version {
  id: string
  created_at: string
  snapshot: string | null
}

export default function PlayPage({ params }: { params: { sceneId: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sceneData, setSceneData] = useState<any>(null)
  const [showSaveMenu, setShowSaveMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    
    try {
      const buffer = await file.arrayBuffer()
      const blob = new Blob([buffer], { type: file.type })
      const url = URL.createObjectURL(blob)
      
      alert(`File "${file.name}" loaded! Opening in editor...`)
      window.location.href = `/wonder-build/playcanvas?import=${encodeURIComponent(url)}`
    } catch (err: any) {
      alert("Failed to import file: " + err.message)
      setLoading(false)
    }
  }

  async function saveToSupabase() {
    try {
      const res = await fetch('/api/scenes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: params.sceneId,
          data: sceneData
        })
      })
      if (res.ok) {
        alert('Scene saved to Wonderland Cloud!')
        setShowSaveMenu(false)
      } else {
        alert('Failed to save. You may need to log in.')
      }
    } catch (e) {
      alert('Error saving scene')
    }
  }

  function downloadScene() {
    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sceneData.name || 'scene'}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowSaveMenu(false)
  }

  useEffect(() => {
    if (!canvasRef.current) return

    async function initScene() {
      try {
        // Load scene from API with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        const res = await fetch(`/api/scenes/${params.sceneId}`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) {
          throw new Error("Scene not found")
        }
        
        const scene = await res.json()
        setSceneData(scene)

        // Create PlayCanvas app
        const canvas = canvasRef.current!
        const app = new pc.Application(canvas, {
          mouse: new pc.Mouse(canvas),
          touch: new pc.TouchDevice(canvas),
          keyboard: new pc.Keyboard(window)
        })

        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
        app.setCanvasResolution(pc.RESOLUTION_AUTO)
        
        app.start()

        // Wait for app to be ready
        await new Promise(resolve => app.on("update", resolve))

        // Load the scene
        await loadSceneInApp(app, scene)

        setLoading(false)
      } catch (err: any) {
        console.error("Failed to load scene:", err)
        setError(err.message || "Failed to load scene")
        setLoading(false)
      }
    }

    initScene()

    // Cleanup
    return () => {
      // Could add cleanup here
    }
  }, [params.sceneId])

  async function loadSceneInApp(app: pc.Application, scene: any) {
    // Create materials
    const createMaterial = (matData: any): pc.StandardMaterial => {
      const material = new pc.StandardMaterial()
      if (matData.color) {
        material.diffuse = new pc.Color(matData.color[0], matData.color[1], matData.color[2])
      }
      if (matData.metalness !== undefined) {
        material.metalness = matData.metalness
      }
      if (matData.roughness !== undefined) {
        material.gloss = 1 - matData.roughness
      }
      if (matData.emissive) {
        material.emissive = new pc.Color(matData.emissive[0], matData.emissive[1], matData.emissive[2])
      }
      material.update()
      return material
    }

    // Create objects
    if (scene.objects) {
      scene.objects.forEach((obj: any) => {
        const entity = new pc.Entity(obj.name || "object")
        
        let primitiveType: string = "box"
        switch (obj.type) {
          case "box": primitiveType = "box"; break
          case "sphere": primitiveType = "sphere"; break
          case "cylinder": primitiveType = "cylinder"; break
          case "plane": primitiveType = "plane"; break
          case "capsule": primitiveType = "capsule"; break
          case "cone": primitiveType = "cone"; break
          case "torus": primitiveType = "torus"; break
        }
        
        entity.addComponent("render", { type: primitiveType })
        
        if (obj.position) {
          entity.setPosition(obj.position[0], obj.position[1], obj.position[2])
        }
        if (obj.rotation) {
          entity.setEulerAngles(obj.rotation[0], obj.rotation[1], obj.rotation[2])
        }
        if (obj.scale) {
          entity.setLocalScale(obj.scale[0], obj.scale[1], obj.scale[2])
        }
        
        if (obj.material) {
          const mat = createMaterial(obj.material)
          const render = entity.render as pc.RenderComponent
          render.material = mat
        }
        
        app.root.addChild(entity)
      })
    }

    // Create lights
    if (scene.lights) {
      scene.lights.forEach((light: any) => {
        const entity = new pc.Entity(light.type === "directional" ? "Directional Light" : "Point Light")
        
        entity.addComponent("light", {
          type: light.type || "directional",
          color: new pc.Color(light.color[0], light.color[1], light.color[2]),
          intensity: light.intensity || 1
        })
        
        if (light.position) {
          entity.setPosition(light.position[0], light.position[1], light.position[2])
        }
        
        app.root.addChild(entity)
      })
    }

    // Create camera
    const cam = new pc.Entity("Camera")
    cam.addComponent("camera", {
      fov: scene.camera?.fov || 45,
      clearColor: new pc.Color(0.05, 0.05, 0.08)
    })
    
    if (scene.camera?.position) {
      cam.setPosition(scene.camera.position[0], scene.camera.position[1], scene.camera.position[2])
    } else {
      cam.setPosition(0, 5, 10)
    }
    
    const target = scene.camera?.target || [0, 0, 0]
    cam.lookAt(new pc.Vec3(target[0], target[1], target[2]))
    
    app.root.addChild(cam)

    // Handle resize
    const resize = () => {
      app.resizeCanvas()
    }
    window.addEventListener("resize", resize)
    
    // Add simple orbit camera controls
    let isDragging = false
    let lastX = 0
    let lastY = 0
    let rotX = 0
    let rotY = 0
    
    canvas.addEventListener("mousedown", (e) => {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
    })
    
    canvas.addEventListener("mouseup", () => {
      isDragging = false
    })
    
    canvas.addEventListener("mousemove", (e) => {
      if (!isDragging) return
      
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      
      rotX -= dy * 0.3
      rotY -= dx * 0.3
      
      cam.setEulerAngles(rotX, rotY, 0)
      
      lastX = e.clientX
      lastY = e.clientY
    })
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading 3D Scene...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/game-builder/create" className="text-green-400 hover:underline">
            Create a new scene
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen">
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Header with scene info */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-white font-semibold text-lg">
              {sceneData?.name || "3D Scene"}
            </h1>
            <p className="text-white/50 text-sm">
              {sceneData?.description || "AI Generated Scene"}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              className="px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition flex items-center gap-2"
            >
              📁 Import
            </button>
            <button
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className="px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition flex items-center gap-2"
            >
              💾 Save
            </button>
            {showSaveMenu && (
              <div className="absolute top-full right-0 mt-2 bg-black/95 border border-white/20 rounded-lg p-4 z-50 min-w-[200px]">
                <p className="text-white/60 text-xs mb-3">Choose storage location:</p>
                <button
                  onClick={() => saveToSupabase()}
                  className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded flex items-center gap-2"
                >
                  ☁️ Save to Wonderland Cloud
                </button>
                <button
                  onClick={() => downloadScene()}
                  className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded flex items-center gap-2"
                >
                  💿 Download as JSON
                </button>
                <button
                  onClick={() => window.location.href = '/settings/cloud-storage'}
                  className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded flex items-center gap-2"
                >
                  🔗 Connect Your Own Storage
                </button>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              accept=".glb,.gltf,.fbx,.obj"
              className="hidden"
              onChange={handleFileImport}
            />
            <Link
              href={`/wonder-build/playcanvas?scene=${params.sceneId}`}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition"
            >
              ✏️ Open in Editor
            </Link>
            <Link
              href="/game-builder/create"
              className="px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition"
            >
              Create New
            </Link>
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-white/30 text-xs">
        Click and drag to rotate camera
      </div>
    </div>
  )
}