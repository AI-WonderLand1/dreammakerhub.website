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

export class PlayCanvasGestureBridge {
  private app: any
  private intentDetector: IntentDetector
  private samples: MotionSample[] = []
  private targetEntity: any
  private config: GestureBridgeConfig
  private animationFrameId: number | null = null
  private lastEvent: GestureEvent | null = null
  private canvas: HTMLCanvasElement | null = null

  private mouseDown = false
  private lastMouseX = 0
  private lastMouseY = 0
  private lastMouseTime = 0
  private accumulatedEvent: Partial<GestureEvent> = {}

  constructor(app: any, config?: Partial<GestureBridgeConfig>) {
    this.app = app
    this.intentDetector = new IntentDetector(800)
    this.config = {
      enabled: true,
      sensitivity: 1.0,
      smoothing: 0.85,
      ...config,
    }
  }

  setTarget(entity: any): void {
    this.targetEntity = entity
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
      if (!this.config.enabled || !this.app) {
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

  private update(): void {
    if (this.samples.length < 2 || !this.app) return

    const intent = this.intentDetector.evaluate()
    if (!intent.isIntentional) {
      this.accumulatedEvent = {}
      return
    }

    const lateralGesture = classifyLateralMotion(this.samples)
    const spatialGesture = classifySpatialGesture(this.samples, lateralGesture)

    if (spatialGesture.confidence < 0.3) return

    const event: GestureEvent = {
      gesture: spatialGesture.gesture,
      rotation: spatialGesture.transform.rotation,
      position: spatialGesture.transform.position,
      scale: spatialGesture.transform.scale,
      confidence: spatialGesture.confidence,
    }

    event.rotation.x *= intent.confidence
    event.rotation.y *= intent.confidence
    event.rotation.z *= intent.confidence

    this.lastEvent = event

    this.applyToScene(event)
  }

  private applyToScene(event: GestureEvent): void {
    if (!this.app) return

    const entity = this.targetEntity || this.getDefaultTarget()
    if (!entity) return

    if (entity.getComponent('camera')) {
      this.applyCameraTransform(entity, event)
    } else if (entity.getComponent('render')) {
      this.applyObjectTransform(entity, event)
    }
  }

  private getDefaultTarget(): any {
    if (!this.app?.root) return null
    const children = this.app.root.getChildren()
    for (const child of children) {
      if (child.getComponent('render') || child.name === 'Camera') {
        return child
      }
    }
    return this.app.root
  }

  private applyCameraTransform(entity: any, event: GestureEvent): void {
    const smoothFactor = 1 - this.config.smoothing
    const currentRot = entity.getEulerAngles()
    entity.setEulerAngles(
      currentRot.x + event.rotation.x * smoothFactor * 0.1,
      currentRot.y + event.rotation.y * smoothFactor * 0.1,
      currentRot.z + event.rotation.z * smoothFactor * 0.1,
    )

    if (event.gesture === 'swipe') {
      const currentPos = entity.getPosition()
      entity.setPosition(
        currentPos.x + event.position.x * smoothFactor * 0.5,
        currentPos.y + event.position.y * smoothFactor * 0.5,
        currentPos.z,
      )
    }

    if (event.gesture === 'wave') {
      const currentScale = entity.getLocalScale()
      entity.setLocalScale(
        currentScale.x * event.scale.x,
        currentScale.y * event.scale.y,
        currentScale.z * event.scale.z,
      )
    }
  }

  private applyObjectTransform(entity: any, event: GestureEvent): void {
    const smoothFactor = 1 - this.config.smoothing

    const currentRot = entity.getEulerAngles()
    entity.setEulerAngles(
      currentRot.x + event.rotation.x * smoothFactor * 0.05,
      currentRot.y + event.rotation.y * smoothFactor * 0.05,
      currentRot.z + event.rotation.z * smoothFactor * 0.05,
    )

    if (event.gesture === 'swipe') {
      const currentPos = entity.getPosition()
      entity.setPosition(
        currentPos.x + event.position.x * smoothFactor * 0.1,
        currentPos.y - event.position.y * smoothFactor * 0.1,
        currentPos.z,
      )
    }

    if (event.gesture === 'wave') {
      const currentScale = entity.getLocalScale()
      entity.setLocalScale(
        currentScale.x + (event.scale.x - currentScale.x) * smoothFactor,
        currentScale.y + (event.scale.y - currentScale.y) * smoothFactor,
        currentScale.z + (event.scale.z - currentScale.z) * smoothFactor,
      )
    }
  }

  get lastKnownEvent(): GestureEvent | null {
    return this.lastEvent
  }

  destroy(): void {
    this.detach()
    this.samples = []
    this.lastEvent = null
    this.targetEntity = null
  }
}