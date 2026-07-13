export interface SpatialAsset {
  id: string
  kind: 'splat' | 'model' | 'texture' | 'hdr' | 'world'
  url: string
  format?: 'ply' | 'splat' | 'ksplat' | 'glb' | 'gltf' | 'png' | 'jpg' | 'hdr'
  label?: string
  meta?: Record<string, unknown>
}

export interface AssetManagerOptions {
  maxCacheSize?: number
}

/**
 * Manages spatial assets referenced by a world.
 *
 * Responsibilities:
 *  - Resolve logical asset ids to concrete URLs (local, CDN, or Supabase storage).
 *  - De-duplicate and cache fetched blobs so the renderer does not reload them.
 *  - Provide a single source of truth for what an engine instance can draw.
 *
 * Non-breaking: this module only reads from the provided world definition and
 * never mutates existing projects, engines, or export pipelines.
 */
export class AssetManager {
  private assets = new Map<string, SpatialAsset>()
  private cache = new Map<string, ArrayBuffer>()
  private maxCacheSize: number

  constructor(options: AssetManagerOptions = {}) {
    this.maxCacheSize = options.maxCacheSize ?? 64
  }

  register(asset: SpatialAsset): void {
    this.assets.set(asset.id, asset)
  }

  registerMany(assets: SpatialAsset[]): void {
    for (const asset of assets) this.register(asset)
  }

  get(id: string): SpatialAsset | undefined {
    return this.assets.get(id)
  }

  list(): SpatialAsset[] {
    return Array.from(this.assets.values())
  }

  listSplats(): SpatialAsset[] {
    return this.list().filter((a) => a.kind === 'splat')
  }

  /**
   * Resolve an asset id (or raw URL) to a concrete URL string the renderer can load.
   */
  resolveUrl(ref: string): string {
    const asset = this.assets.get(ref)
    if (asset) return asset.url
    // Already a raw URL or path.
    return ref
  }

  /**
   * Fetch and cache the raw bytes for an asset. Used by renderers that need
   * an ArrayBuffer (e.g. raw .splat / .ply training outputs).
   */
  async fetchBytes(ref: string): Promise<ArrayBuffer> {
    const url = this.resolveUrl(ref)
    const cached = this.cache.get(url)
    if (cached) return cached

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`AssetManager: failed to fetch ${url} (${res.status})`)
    }
    const buf = await res.arrayBuffer()

    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(url, buf)
    return buf
  }

  clearCache(): void {
    this.cache.clear()
  }
}
