export interface EngineConfig {
  canvas: HTMLCanvasElement
  width?: number
  height?: number
  onFrame?: (time: number) => void
  onReady?: () => void
  onError?: (error: Error) => void
  [key: string]: unknown
}

export interface EngineInstance {
  name: string
  canvas: HTMLCanvasElement
  context: WebGLRenderingContext | WebGL2RenderingContext | null
  device: GPUDevice | null
  destroy: () => Promise<void> | void
}

export interface ActiveEngine {
  name: string
  canvas: HTMLCanvasElement
  context: WebGLRenderingContext | WebGL2RenderingContext | null
  device: GPUDevice | null
  rafId: number | null
  destroy: () => Promise<void> | void
  onFrame?: (time: number) => void
}

export type EngineName = 'playcanvas' | 'webgl' | 'threejs' | 'babylon' | 'webgpu' | 'spatial' | 'custom'
