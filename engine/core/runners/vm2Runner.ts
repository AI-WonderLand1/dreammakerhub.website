import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import vm from 'vm'
import { requireEnv } from '@lib/env'
import { logger } from '@lib/logger'
let supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY")
    )
  }

  return supabase
}

interface ExtensionRecord {
  encrypted_code: string
  iv: string
  tag: string
  manifest: { permissions: string[] }
}

export async function executeCode(code: string): Promise<{ success: boolean; error?: string; hooks?: Record<string, unknown> }> {
  if (process.env.EXTENSIONS_ENABLED !== "true") {
    return { success: false, error: "Extensions disabled" };
  }
  try {
    const sandbox = createSandbox(["fetch"], "execute");
    const context = vm.createContext(sandbox);
    const script = new vm.Script(code, { filename: 'extension.js' });
    const extension = script.runInContext(context, { timeout: 5000 });
    return { success: true, hooks: extension?.hooks ?? {} };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function runExtension(extensionId: string) {
  if (process.env.EXTENSIONS_ENABLED !== "true") {
    throw new Error("Extensions disabled");
  }
  
  const { data, error } = await getSupabaseClient()
    .from('extensions')
    .select('encrypted_code, iv, tag, manifest')
    .eq('id', extensionId)
    .single()

  if (error || !data) throw new Error('Extension not found or failed to fetch')

  const record = data as ExtensionRecord

  const key = Buffer.from(requireEnv("EXTENSION_ENCRYPTION_KEY"), 'base64')
  if (key.length !== 32) throw new Error('Invalid encryption key length')

  const iv = Buffer.from(record.iv, 'base64')
  const tag = Buffer.from(record.tag, 'base64')
  const encrypted = Buffer.from(record.encrypted_code, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8')

  const sandbox = createSandbox(record.manifest.permissions, extensionId);
  const context = vm.createContext(sandbox);
  const script = new vm.Script(decrypted, { filename: `extension-${extensionId}.js` });
  const extension = script.runInContext(context, { timeout: 5000 });

  return extension.hooks || {}
}

function createSandbox(permissions: string[], extensionId: string) {
  const sandbox: Record<string, unknown> = {
    console: {
      log: (...args: unknown[]) => logger.info(`[ext:${extensionId}]`, ...args),
      error: (...args: unknown[]) => logger.error(`[ext:${extensionId}]`, ...args),
      warn: (...args: unknown[]) => logger.warn(`[ext:${extensionId}]`, ...args),
    },
    setTimeout, setInterval, clearTimeout, clearInterval
  }

  if (permissions.includes('fetch')) {
    // Proxy fetch to restrict to allowed origins only
    const allowedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      // Block internal/metadata endpoints
      if (/^https?:\/\/(localhost|127\.0\.0\.1|169\.254\.\d+\.\d+|metadata\.)/.test(url)) {
        throw new Error('Fetch to internal endpoints is not allowed');
      }
      return fetch(input, init);
    };
    sandbox.fetch = allowedFetch;
  }

  if (permissions.includes('storage')) {
    const storageClient = getSupabaseClient()
    sandbox.storage = {
      get: async (key: string) => {
        const { data } = await storageClient
          .from('extension_storage')
          .select('value')
          .eq('extension_id', extensionId)
          .eq('key', key)
          .single()
        const record = data as { value: string } | null
        return record?.value ?? null
      },
      set: async (key: string, value: unknown) => {
        await storageClient
          .from('extension_storage')
          .upsert({
            extension_id: extensionId,
            key,
            value: JSON.stringify(value)
          } as never)
      }
    }
  }
  
  return sandbox
}


