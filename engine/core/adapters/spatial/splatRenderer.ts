import * as THREE from 'three'
import type { AssetManager } from './assetManager'
import type { SpatialWorld } from './worldLoader'

/**
 * Gaussian Splatting renderer (DreamMakerHub Spatial Engine default).
 *
 * Integrates @mkkellogg/gaussian-splats-3d via a dynamic import so the adapter
 * degrades gracefully to the Three.js renderer if the dependency is missing
 * in a given environment. The viewer owns its own scene/camera/RAF loop.
 */
export class SplatRenderer {
  public readonly name = 'splat'
  private viewer: any = null
  private canvas: HTMLCanvasElement
  private assets: AssetManager
  private world: SpatialWorld
  private onFrame?: (time: number) => void
  private disposed = false

  constructor(opts: {
    canvas: HTMLCanvasElement
    assets: AssetManager
    world: SpatialWorld
    onFrame?: (time: number) => void
  }) {
    this.canvas = opts.canvas
    this.assets = opts.assets
    this.world = opts.world
    this.onFrame = opts.onFrame
  }

  async init(): Promise<{ context: WebGLRenderingContext | WebGL2RenderingContext | null }> {
    const lib = await this.loadLibrary()

    const splats = this.assets.listSplats()
    if (splats.length === 0) {
      throw new Error('SplatRenderer: world has no splat assets to display')
    }

    const viewer = new lib.Viewer({
      'cameraUp': [0, 1, 0],
      'initialCameraPosition': [0, 2, 6],
      'initialCameraLookAt': [0, 0, 0],
      'rootElement': this.canvas.parentElement ?? this.canvas,
      'useBuiltInControls': true,
      'ignoreDevicePixelRatio': false,
      'gpuAcceleratedSort': true,
    })

    // Apply environment background if provided (best-effort; Viewer manages its own scene).
    const bg = this.world.environment?.background
    if (bg && viewer.setBackground) viewer.setBackground(new THREE.Color(bg).getHex())

    for (const splat of splats) {
      await viewer.addSplatScene(this.assets.resolveUrl(splat.id), {
        splatAlphaRemovalThreshold: 1,
        showLoadingUI: false,
        progressiveLoad: true,
        position: splat.meta?.position as number[] | undefined,
        rotation: splat.meta?.rotation as number[] | undefined,
        scale: (splat.meta?.scale as number | undefined) ?? 1,
      })
    }

    // Hook the engine manager's frame callback into the splat render loop.
    if (this.onFrame) {
      const tick = () => {
        if (this.disposed) return
        this.onFrame?.(performance.now())
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    await viewer.start()
    this.viewer = viewer

    const context = (viewer.renderer?.getContext?.() ??
      this.canvas.getContext('webgl2') ??
      this.canvas.getContext('webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null

    return { context }
  }

  private async loadLibrary(): Promise<any> {
    try {
      return await import('@mkkellogg/gaussian-splats-3d')
    } catch (err) {
      throw new Error(
        'SplatRenderer: @mkkellogg/gaussian-splats-3d is not installed. ' +
          'Run `npm install @mkkellogg/gaussian-splats-3d` to enable Gaussian Splatting. ' +
          `Underlying error: ${(err as Error).message}`
      )
    }
  }

  async destroy(): Promise<void> {
    this.disposed = true
    if (this.viewer) {
      try {
        await this.viewer.dispose()
      } catch {
        /* ignore */
      }
      this.viewer = null
    }
  }
}
