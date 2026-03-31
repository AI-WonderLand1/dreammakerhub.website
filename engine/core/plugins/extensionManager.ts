import { VM } from 'vm2'
import { logger } from '../../lib/logger'

export interface Extension {
  id: string
  name: string
  code: string
  permissions: string[]
  hooks: Record<string, Function>
}

export class ExtensionManager {
  private extensions = new Map<string, Extension>()
  private hooks = new Map<string, Function[]>()

     async install(manifest: any, code: string) {
    if (process.env.EXTENSIONS_ENABLED !== "true") {
      throw new Error("Extensions disabled");
    } 
   // 1. Validate + encrypt via Supabase Edge Function
    const validation = await fetch('/api/extensions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest, code })
    }).then(res => res.json())

    if (validation.error) {
      throw new Error(`Extension validation failed: ${validation.error}`)
    }

    // 2. Safe to run in vm2 because validator already scanned it
    const vm = new VM({
      timeout: 5000,
      sandbox: this.createSandbox(manifest.permissions)
    })

    const extension = vm.run(code)

    // 3. Register hooks
    for (const [hookName, handler] of Object.entries(extension.hooks || {})) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, [])
      }
      this.hooks.get(hookName)!.push(handler as Function)
    }

    // 4. Store extension metadata locally (Supabase stores encrypted copy)
    this.extensions.set(manifest.id, {
      ...manifest,
      code,
      hooks: extension.hooks
    })

    return manifest.id
  }

  async executeHook(hookName: string, ...args: any[]) {
    const handlers = this.hooks.get(hookName) || []

    const results = []
    for (const handler of handlers) {
      try {
        const result = await handler(...args)
        results.push(result)
      } catch (err) {
        logger.error(`Hook ${hookName} failed`, { error: err })
      }
    }

    return results
  }

  private createSandbox(permissions: string[]) {
    const sandbox: any = {
      console: console,
      setTimeout, setInterval, clearTimeout, clearInterval
    }

    if (permissions.includes('fetch')) {
      sandbox.fetch = fetch
    }

    if (permissions.includes('storage')) {
      sandbox.storage = {
        get: async (key: string) => {
          // Implement storage
        },
        set: async (key: string, value: any) => {
          // Implement storage
        }
      }
    }

    return sandbox
  }

  uninstall(extensionId: string) {
    const ext = this.extensions.get(extensionId)
    if (!ext) return

    // Remove all hooks from this extension
    for (const [hookName, handlers] of this.hooks) {
      this.hooks.set(
        hookName,
        handlers.filter(h => !Object.values(ext.hooks).includes(h))
      )
    }

    this.extensions.delete(extensionId)
  }
}

export const extensionManager = new ExtensionManager()
