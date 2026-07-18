import type { PluginManifest, EngineType } from './types'

export function validateManifest(raw: Record<string, unknown>): PluginManifest {
  const required = ['id', 'name', 'version', 'description', 'author', 'engine', 'hooks', 'permissions', 'entryPoint']
  for (const field of required) {
    if (!(field in raw)) {
      throw new Error(`Plugin manifest missing required field: ${field}`)
    }
  }

  const validEngines: EngineType[] = ['babylon', 'three', 'unity', 'unreal', 'godot', 'blender', 'playcanvas']
  if (!validEngines.includes(raw.engine as EngineType)) {
    throw new Error(`Invalid engine type: ${raw.engine}. Must be one of: ${validEngines.join(', ')}`)
  }

  if (!Array.isArray(raw.hooks)) {
    throw new Error('Plugin manifest hooks must be an array')
  }

  if (!Array.isArray(raw.permissions)) {
    throw new Error('Plugin manifest permissions must be an array')
  }

  return {
    id: String(raw.id),
    name: String(raw.name),
    version: String(raw.version),
    description: String(raw.description),
    author: String(raw.author),
    engine: raw.engine as EngineType,
    hooks: raw.hooks as string[],
    permissions: raw.permissions as string[],
    entryPoint: String(raw.entryPoint),
    assetsUrl: String(raw.assetsUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl) : undefined,
    website: raw.website ? String(raw.website) : undefined,
    dependencies: raw.dependencies ? (raw.dependencies as Record<string, string>) : undefined,
  }
}

export function createManifestFromUrl(url: string): Promise<PluginManifest> {
  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`Failed to fetch plugin manifest: ${r.statusText}`)
      return r.json()
    })
    .then(validateManifest)
}
