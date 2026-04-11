import { getQuickJS, QuickJSContext } from 'quickjs-emscripten'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { env, requireEnv } from '@lib/env'

let supabase: ReturnType<typeof createClient> | null = null
let quickJSInstance: Awaited<ReturnType<typeof getQuickJS>> | null = null

async function getQuickJSInstance() {
  if (!quickJSInstance) {
    quickJSInstance = await getQuickJS()
  }
  return quickJSInstance
}

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      requireEnv(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY")
    )
  }

  return supabase
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

  const key = Buffer.from(requireEnv(env.EXTENSION_ENCRYPTION_KEY, "EXTENSION_ENCRYPTION_KEY"), 'base64')
  if (key.length !== 32) throw new Error('Invalid encryption key length')

  const iv = Buffer.from(data.iv, 'base64')
  const tag = Buffer.from(data.tag, 'base64')
  const encrypted = Buffer.from(data.encrypted_code, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8')

  const vm = new VM({
    timeout: 5000,
    sandbox: createSandbox(data.manifest.permissions, extensionId)
  })

  const extension = vm.run(decrypted)

  return extension.hooks || {}
}

function createSandbox(permissions: string[], extensionId: string) {
  const sandbox: any = {
    console: console,
    setTimeout, setInterval, clearTimeout, clearInterval
  }

  if (permissions.includes('fetch')) {
    sandbox.fetch = fetch
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
        return data?.value ?? null
      },
      set: async (key: string, value: any) => {
        await storageClient
          .from('extension_storage')
          .upsert({
            extension_id: extensionId,
            key,
            value: JSON.stringify(value)
          })
      }
    `
    
    // Execute with timeout
    const result = context.evalCode(wrappedCode, {
      memoryLimitBytes: 128 * 1024 * 1024, // 128MB memory limit
      shouldInterruptAfterDeadline: Date.now() + 5000, // 5 second timeout
    })
    
    if (result.error) {
      const errorMsg = context.getString(result.error)
      result.error.dispose()
      throw new Error(`Extension execution error: ${errorMsg}`)
    }
    
    // Convert result to native JS object
    // Note: This is simplified - real implementation needs proper handle management
    const nativeResult = context.dump(result.value)
    result.value.dispose()
    
    return nativeResult
    
  } finally {
    context.dispose()
  }
}

function isInternalUrl(url: string): boolean {
  const internalPatterns = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./i,
    /^https?:\/\/10\./i,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./i,
    /^https?:\/\/192\.168\./i,
    /^https?:\/\/0\./i,
    /^https?:\/\/::1/i,
    /^file:/i,
  ]
  
  return internalPatterns.some(pattern => pattern.test(url))
}
