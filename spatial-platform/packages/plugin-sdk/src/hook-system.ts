import type { PluginHook, PluginInstance, PluginContext, HookHandler, PluginManifest } from './types'
import { createPluginAPI } from './api-client'
import { validateManifest } from './manifest'

type HookRegistry = Map<PluginHook, Set<PluginInstance>>

export class HookSystem {
  private registry: HookRegistry = new Map()
  private plugins: Map<string, PluginInstance> = new Map()

  constructor() {
    const hooks: PluginHook[] = [
      'onSceneInit', 'onSceneLoad', 'onSceneSave',
      'onObjectCreate', 'onObjectSelect', 'onObjectDelete', 'onObjectMove',
      'onCameraChange', 'onRenderFrame',
      'onPluginActivate', 'onPluginDeactivate',
      'onKeyDown', 'onKeyUp',
    ]
    for (const hook of hooks) {
      this.registry.set(hook, new Set())
    }
  }

  async register(
    manifest: PluginManifest,
    handlers: Partial<Record<PluginHook, HookHandler>>,
    baseUrl: string,
    token: string
  ): Promise<PluginInstance> {
    const store = new Map<string, unknown>()
    const pluginStore = {
      get: <T>(key: string) => store.get(key) as T | undefined,
      set: <T>(key: string, value: T) => { store.set(key, value) },
      delete: (key: string) => { store.delete(key) },
      clear: () => { store.clear() },
    }

    const api = createPluginAPI(baseUrl, token)
    const context: PluginContext = { manifest, api, store: pluginStore }

    const instance: PluginInstance = {
      manifest,
      context,
      activate: async () => {
        if (handlers.onPluginActivate) {
          await handlers.onPluginActivate(context)
        }
        for (const hook of manifest.hooks as PluginHook[]) {
          const set = this.registry.get(hook)
          if (set) {
            set.add(instance)
          }
        }
      },
      deactivate: async () => {
        if (handlers.onPluginDeactivate) {
          await handlers.onPluginDeactivate(context)
        }
        for (const [, set] of this.registry) {
          set.delete(instance)
        }
      },
      handlesHook: (hook: PluginHook) => {
        return manifest.hooks.includes(hook) && !!handlers[hook]
      },
      executeHook: async (hook: PluginHook, ...args: unknown[]) => {
        const handler = handlers[hook]
        if (handler) {
          await handler(context, ...args)
        }
      },
    }

    this.plugins.set(manifest.id, instance)
    return instance
  }

  async execute(hook: PluginHook, ...args: unknown[]): Promise<void> {
    const instances = this.registry.get(hook)
    if (!instances) return
    for (const instance of instances) {
      if (instance.handlesHook(hook)) {
        await instance.executeHook(hook, ...args)
      }
    }
  }

  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id)
  }

  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  async unregister(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (instance) {
      await instance.deactivate()
      this.plugins.delete(id)
    }
  }

  async loadFromUrl(
    manifestUrl: string,
    handlers: Partial<Record<PluginHook, HookHandler>>,
    baseUrl: string,
    token: string
  ): Promise<PluginInstance> {
    const manifest = await fetch(manifestUrl).then(r => r.json()).then(validateManifest)
    return this.register(manifest, handlers, baseUrl, token)
  }

  async clear(): Promise<void> {
    const results = []
    for (const instance of this.plugins.values()) {
      results.push(instance.deactivate().catch(() => {}))
    }
    await Promise.allSettled(results)
    this.plugins.clear()
    for (const [, set] of this.registry) {
      set.clear()
    }
  }
}
