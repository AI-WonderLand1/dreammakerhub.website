import type { EngineAdapter, EngineConfig, EngineInstance } from '../types'
import { AssetManager } from './assetManager'
import { WorldLoader, type SpatialWorld } from './worldLoader'
import { SplatRenderer } from './splatRenderer'
import { ThreeRenderer } from './threeRenderer'

/**
 * DreamMakerHub Spatial Engine adapter.
 *
 * Default renderer is Gaussian Splatting. When the active world contains no
 * splat assets (or the splat runtime is unavailable) it transparently falls
 * back to the Three.js renderer. Registration is additive only — it never
 * touches the other engines, the Engine Registry, export pipelines, or AI
 * routing, satisfying the non-breaking constraints of Phase 1.
 */
export class SpatialAdapter implements EngineAdapter {
  public name = 'spatial'

  public async create(config: EngineConfig): Promise<EngineInstance> {
    console.log('[SpatialAdapter] Creating DreamMakerHub Spatial Engine instance...')

    const worldSource =
      (config.world as SpatialWorld | string | Record<string, unknown> | undefined) ?? EMPTY_WORLD

    const { world, assets } = await new WorldLoader().load(worldSource as any)
    const rendererMode = WorldLoader.defaultRendererFor(world)

    const onFrame = config.onFrame

    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null
    let destroy: () => Promise<void>

    if (rendererMode === 'splat') {
      try {
        const splat = new SplatRenderer({ canvas: config.canvas, assets, world, onFrame })
        const res = await splat.init()
        context = res.context
        destroy = () => splat.destroy()
        console.log('[SpatialAdapter] Active renderer: Gaussian Splatting')
      } catch (err) {
        console.warn(
          '[SpatialAdapter] Splat renderer unavailable, falling back to Three.js:',
          (err as Error).message
        )
        const three = new ThreeRenderer({ canvas: config.canvas, assets, world, onFrame })
        const res = await three.init()
        context = res.context
        destroy = () => three.destroy()
      }
    } else {
      const three = new ThreeRenderer({ canvas: config.canvas, assets, world, onFrame })
      const res = await three.init()
      context = res.context
      destroy = () => three.destroy()
      console.log('[SpatialAdapter] Active renderer: Three.js')
    }

    if (config.onReady) config.onReady()

    console.log('[SpatialAdapter] Engine instance created successfully')

    return {
      name: this.name,
      canvas: config.canvas,
      context,
      device: null,
      destroy,
    }
  }
}

const EMPTY_WORLD: SpatialWorld = { version: 1, nodes: [], assets: [] }
