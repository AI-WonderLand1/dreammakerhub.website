import vm from 'vm'
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

     async install(manifest: Record<string, unknown>, code: string) {
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

    // 2. Run in isolated Node.js vm context
    const sandbox = this.createSandbox(manifest.permissions as string[]);
    const context = vm.createContext(sandbox);
    const script = new vm.Script(code, { filename: 'extension.js' });
    const extension = script.runInContext(context, { timeout: 5000 });

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

  async executeHook(hookName: string, ...args: unknown[]) {
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
    const sandbox: Record<string, unknown> = {
      console,
      setTimeout, setInterval, clearTimeout, clearInterval
    }

    if (permissions.includes('fetch')) {
      sandbox.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (/^https?:\/\/(localhost|127\.0\.0\.1|169\.254\.\d+\.\d+|metadata\.)/.test(url)) {
          throw new Error('Fetch to internal endpoints is not allowed');
        }
        return fetch(input, init);
      };
    }

    if (permissions.includes('storage')) {
      sandbox.storage = {
        get: async (_key: string) => {
          return null;
        },
        set: async (_key: string, _value: unknown) => {
          // no-op
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
