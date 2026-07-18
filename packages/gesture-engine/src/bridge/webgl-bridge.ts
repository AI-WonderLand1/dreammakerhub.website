import type { MotionSample } from '../core/intent'
import { computeSpatialTransform, classifySpatialGesture } from '../core/spatial'
import { IntentDetector } from '../core/intent'
import { classifyLateralMotion, type LateralGesture } from '../core/patterns'

export interface GestureBridgeConfig {
  enabled: boolean
  sensitivity: number
  smoothing: number
}

export interface GestureEvent {
  gesture: LateralGesture
  rotation: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  confidence: number
}

interface CoreMesh {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface CoreEngine {
  meshes?: CoreMesh[]
  Mesh?: (type: string) => CoreMesh
  addMesh?: (mesh: CoreMesh) => void
  setCamera?: (position: [number, number, number], target: [number, number, number]) => void
  addLight?: (type: string, color: [number, number, number], intensity: number) => void
  setSky?: (color: [number, number, number], type: string) => void
  init?: () => void
}

export class WebGLGestureBridge {
  private engine: CoreEngine | null = null
  private intentDetector: IntentDetector
  private samples: MotionSample[] = []
  private selectedMeshIndex = 0
  private config: GestureBridgeConfig
  private animationFrameId: number | null = null
  private lastEvent: GestureEvent | null = null
  private canvas: HTMLCanvasElement | null = null

  private mouseDown = false
  private lastMouseX = 0
  private lastMouseY = 0
  private lastMouseTime = 0

  private readonly SMOOTH_WEIGHT = 0.15

  private smoothRot: [number, number, number] = [0, 0, 0]
  private smoothPos: [number, number, number] = [0, 0, 0]
  private smoothScale: [number, number, number] = [1, 1, 1]

  constructor(config?: Partial<GestureBridgeConfig>) {
    this.intentDetector = new IntentDetector(800)
    this.config = {
      enabled: true,
      sensitivity: 1.0,
      smoothing: 0.85,
      ...config,
    }
  }

  selectMesh(index: number): void {
    this.selectedMeshIndex = index
  }

  enable(): void {
    this.config.enabled = true
    if (this.canvas) {
      this.attachInputListeners(this.canvas)
    }
    this.startAnimationLoop()
  }

  disable(): void {
    this.config.enabled = false
    this.detachInputListeners()
    this.stopAnimationLoop()
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.engine = (window as any).CORE ?? null
    this.attachInputListeners(canvas)
    this.startAnimationLoop()
  }

  detach(): void {
    this.detachInputListeners()
    this.stopAnimationLoop()
    this.canvas = null
  }

  private attachInputListeners(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', this.handleMouseDown)
    canvas.addEventListener('mousemove', this.handleMouseMove)
    canvas.addEventListener('mouseup', this.handleMouseUp)
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false })
  }

  private detachInputListeners(): void {
    if (!this.canvas) return
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.config.enabled) return
    this.mouseDown = true
    this.lastMouseX = e.clientX
    this.lastMouseY = e.clientY
    this.lastMouseTime = performance.now()
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.mouseDown || !this.config.enabled) return
    this.processInput(e.clientX, e.clientY, performance.now())
  }

  private handleMouseUp = (): void => {
    this.mouseDown = false
    this.samples = []
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (!this.config.enabled) return
    e.preventDefault()
    const touch = e.touches[0]
    this.lastMouseX = touch.clientX
    this.lastMouseY = touch.clientY
    this.lastMouseTime = performance.now()
  }

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.config.enabled) return
    e.preventDefault()
    const touch = e.touches[0]
    this.processInput(touch.clientX, touch.clientY, performance.now())
  }

  private handleTouchEnd = (): void => {
    this.samples = []
  }

  private processInput(clientX: number, clientY: number, timestamp: number): void {
    const dx = clientX - this.lastMouseX
    const dy = clientY - this.lastMouseY
    const dt = Math.max(timestamp - this.lastMouseTime, 1)
    const velocity = Math.sqrt(dx * dx + dy * dy) / dt * this.config.sensitivity

    const sample: MotionSample = {
      timestamp,
      wrist: {
        x: clientX / (this.canvas?.width || 1920),
        y: clientY / (this.canvas?.height || 1080),
        z: 0,
      },
      velocity,
      direction: Math.atan2(dy, dx),
    }

    this.samples.push(sample)
    this.intentDetector.addSample(sample)
    this.lastMouseX = clientX
    this.lastMouseY = clientY
    this.lastMouseTime = timestamp
  }

  private startAnimationLoop(): void {
    const loop = (): void => {
      if (!this.config.enabled) {
        this.animationFrameId = null
        return
      }
      this.update()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    this.animationFrameId = requestAnimationFrame(loop)
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  refreshEngine(): void {
    this.engine = (window as any).CORE ?? null
  }

  private update(): void {
    if (this.samples.length < 2) return

    this.engine = (window as any).CORE ?? this.engine
    if (!this.engine) return

    const intent = this.intentDetector.evaluate()
    if (!intent.isIntentional) return

    const lateralGesture = classifyLateralMotion(this.samples)
    const spatialGesture = classifySpatialGesture(this.samples, lateralGesture)

    if (spatialGesture.confidence < 0.3) return

    const event: GestureEvent = {
      gesture: spatialGesture.gesture,
      rotation: spatialGesture.transform.rotation,
      position: spatialGesture.transform.position,
      scale: spatialGesture.transform.scale,
      confidence: spatialGesture.confidence * intent.confidence,
    }

    this.lastEvent = event
    this.applyToEngine(event)
  }

  private applyToEngine(event: GestureEvent): void {
    const eng = this.engine
    if (!eng || !eng.meshes || eng.meshes.length === 0) return

    const sm = 1 - this.config.smoothing

    this.smoothRot[0] += (event.rotation.x * 0.02 * sm - this.smoothRot[0]) * this.SMOOTH_WEIGHT
    this.smoothRot[1] += (event.rotation.y * 0.02 * sm - this.smoothRot[1]) * this.SMOOTH_WEIGHT
    this.smoothRot[2] += (event.rotation.z * 0.02 * sm - this.smoothRot[2]) * this.SMOOTH_WEIGHT

    this.smoothPos[0] += ((event.position.x - 0.5) * 0.5 * sm - this.smoothPos[0]) * this.SMOOTH_WEIGHT
    this.smoothPos[1] += ((event.position.y - 0.5) * 0.5 * sm - this.smoothPos[1]) * this.SMOOTH_WEIGHT
    this.smoothPos[2] += (event.position.z * sm - this.smoothPos[2]) * this.SMOOTH_WEIGHT

    this.smoothScale[0] += (event.scale.x * sm - this.smoothScale[0]) * this.SMOOTH_WEIGHT
    this.smoothScale[1] += (event.scale.y * sm - this.smoothScale[1]) * this.SMOOTH_WEIGHT
    this.smoothScale[2] += (event.scale.z * sm - this.smoothScale[2]) * this.SMOOTH_WEIGHT

    const selected = this.selectedMeshIndex
    const mesh = event.gesture === 'swipe'
      ? eng.meshes[selected % eng.meshes.length]
      : eng.meshes[0]

    if (!mesh) return

    if (event.gesture === 'swipe') {
      mesh.rotation[0] += this.smoothRot[0]
      mesh.rotation[1] += this.smoothRot[1]
      mesh.rotation[2] += this.smoothRot[2]
      mesh.position[0] += this.smoothPos[0]
      mesh.position[1] -= this.smoothPos[1]
    }

    if (event.gesture === 'wave') {
      const targetScale = this.smoothScale[0]
      mesh.scale[0] = mesh.scale[1] = mesh.scale[2] = targetScale
    }
  }

  get lastKnownEvent(): GestureEvent | null {
    return this.lastEvent
  }

  destroy(): void {
    this.detach()
    this.samples = []
    this.lastEvent = null
    this.engine = null
  }
}