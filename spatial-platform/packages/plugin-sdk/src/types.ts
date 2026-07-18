export type EngineType = 'babylon' | 'three' | 'unity' | 'unreal' | 'godot' | 'blender' | 'playcanvas'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  engine: EngineType
  hooks: string[]
  permissions: string[]
  entryPoint: string
  assetsUrl: string
  thumbnailUrl?: string
  website?: string
  dependencies?: Record<string, string>
}

export interface PluginContext {
  manifest: PluginManifest
  api: PluginAPI
  store: PluginStore
}

export interface PluginStore {
  get: <T>(key: string) => T | undefined
  set: <T>(key: string, value: T): void
  delete: (key: string) => void
  clear: () => void
}

export interface PluginAPI {
  request: <T = unknown>(method: string, path: string, body?: unknown) => Promise<T>
  getWorld: (id: string) => Promise<import('@spatial/core').World>
  updateScene: (worldId: string, scene: import('@spatial/core').SceneData) => Promise<void>
  getAsset: (id: string) => Promise<import('@spatial/core').Asset>
  uploadAsset: (file: File) => Promise<import('@spatial/core').Asset>
  notify: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

export type PluginHook =
  | 'onSceneInit'
  | 'onSceneLoad'
  | 'onSceneSave'
  | 'onObjectCreate'
  | 'onObjectSelect'
  | 'onObjectDelete'
  | 'onObjectMove'
  | 'onCameraChange'
  | 'onRenderFrame'
  | 'onPluginActivate'
  | 'onPluginDeactivate'
  | 'onKeyDown'
  | 'onKeyUp'

export type HookHandler = (context: PluginContext, ...args: unknown[]) => void | Promise<void>

export interface PluginInstance {
  manifest: PluginManifest
  context: PluginContext
  activate: () => Promise<void>
  deactivate: () => Promise<void>
  handlesHook: (hook: PluginHook) => boolean
  executeHook: (hook: PluginHook, ...args: unknown[]) => Promise<void>
}
