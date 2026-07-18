import { Engine } from '@babylonjs/core/Engines/engine'
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine'
import type { Nullable } from '@babylonjs/core/types'

export interface RendererConfig {
  alpha?: boolean
  antialias?: boolean
  preserveDrawingBuffer?: boolean
  preferWebGPU?: boolean
}

export class Renderer {
  readonly canvas: HTMLCanvasElement
  readonly engine: Engine

  private constructor(canvas: HTMLCanvasElement, engine: Engine) {
    this.canvas = canvas
    this.engine = engine
  }

  static async create(
    canvas: HTMLCanvasElement,
    config: RendererConfig = {}
  ): Promise<Renderer> {
    const opts = {
      alpha: config.alpha ?? false,
      antialias: config.antialias ?? true,
      preserveDrawingBuffer: config.preserveDrawingBuffer ?? false,
    }

    let engine: Engine

    if (config.preferWebGPU && typeof navigator.gpu !== 'undefined') {
      const wgpu = new WebGPUEngine(canvas, opts)
      await wgpu.initAsync()
      engine = wgpu
    } else {
      engine = new Engine(canvas, opts.antialias, opts, true)
    }

    return new Renderer(canvas, engine)
  }

  resize(): void {
    this.engine.resize()
  }

  runRenderLoop(callback: () => void): void {
    this.engine.runRenderLoop(callback)
  }

  stopRenderLoop(): void {
    this.engine.stopRenderLoop()
  }

  getHardwareScaling(): number {
    return this.engine.getHardwareScalingLevel()
  }

  setHardwareScaling(level: number): void {
    this.engine.setHardwareScalingLevel(level)
  }

  getFps(): number {
    return this.engine.getFps()
  }

  dispose(): void {
    this.engine.dispose()
  }

  get engineInstance(): Engine {
    return this.engine
  }
}
