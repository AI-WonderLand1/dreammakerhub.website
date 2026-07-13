import { AssetManager, type SpatialAsset } from './assetManager'

/**
 * A serialisable description of a spatial world.
 *
 * The world is engine-agnostic: it lists assets (splats, models, textures)
 * and lightweight scene graph nodes. The SpatialAdapter renders it using
 * Gaussian Splatting by default, falling back to the Three.js renderer when
 * no splats are present or the splat runtime is unavailable.
 */
export interface WorldNode {
  id: string
  assetRef?: string
  type?: 'splat' | 'mesh' | 'light' | 'camera' | 'group'
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  visible?: boolean
  children?: WorldNode[]
  props?: Record<string, unknown>
}

export interface SpatialWorld {
  version: number
  name?: string
  assets?: SpatialAsset[]
  nodes?: WorldNode[]
  environment?: {
    background?: string
    hdr?: string
    ground?: boolean
  }
  settings?: {
    defaultRenderer?: 'splat' | 'three'
  }
}

export interface WorldLoaderOptions {
  baseUrl?: string
}

/**
 * Loads a SpatialWorld from JSON (object, string, or URL) and wires its
 * assets into an AssetManager. Never reaches outside the provided data, so
 * existing engines and projects are untouched.
 */
export class WorldLoader {
  private options: WorldLoaderOptions

  constructor(options: WorldLoaderOptions = {}) {
    this.options = options
  }

  async load(
    source: SpatialWorld | string | Record<string, unknown>,
    assetManager?: AssetManager
  ): Promise<{ world: SpatialWorld; assets: AssetManager }> {
    let world: SpatialWorld

    if (typeof source === 'string') {
      world = await this.loadFromUrl(source)
    } else {
      world = source as SpatialWorld
    }

    const manager = assetManager ?? new AssetManager()
    if (world.assets) manager.registerMany(world.assets)

    return { world, assets: manager }
  }

  private async loadFromUrl(url: string): Promise<SpatialWorld> {
    const target = this.options.baseUrl ? new URL(url, this.options.baseUrl).toString() : url
    const res = await fetch(target)
    if (!res.ok) {
      throw new Error(`WorldLoader: failed to fetch world ${target} (${res.status})`)
    }
    return (await res.json()) as SpatialWorld
  }

  /**
   * Decide which renderer should own a given world.
   * Gaussian Splatting is the default; Three.js is used when there are no
   * splat assets or the world explicitly opts in.
   */
  static defaultRendererFor(world: SpatialWorld): 'splat' | 'three' {
    if (world.settings?.defaultRenderer) return world.settings.defaultRenderer
    const hasSplat = (world.assets ?? []).some((a) => a.kind === 'splat')
    return hasSplat ? 'splat' : 'three'
  }
}
