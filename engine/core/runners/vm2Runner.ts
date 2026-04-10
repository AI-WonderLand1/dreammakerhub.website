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

  // Run in isolated QuickJS context instead of VM2
  const result = await runInSandbox(decrypted, data.manifest.permissions)
  
  return result.hooks || {}
}

async function runInSandbox(code: string, permissions: string[]): Promise<any> {
  const QuickJS = await getQuickJSInstance()
  const context = QuickJS.newContext()
  
  try {
    // Set up safe globals
    const consoleHandle = context.newObject()
    
    // Expose safe console methods
    const logHandle = context.newFunction('log', (...args) => {
      const nativeArgs = args.map(context.getString)
      console.log('[Extension]', ...nativeArgs)
    })
    context.setProp(consoleHandle, 'log', logHandle)
    context.setProp(consoleHandle, 'error', logHandle)
    context.setProp(consoleHandle, 'warn', logHandle)
    context.setProp(consoleHandle, 'info', logHandle)
    
    const global = context.global
    context.setProp(global, 'console', consoleHandle)
    
    // Expose setTimeout/clearTimeout (controlled)
    if (permissions.includes('timers')) {
      // In real implementation, you'd need to bridge these carefully
      // For now, we skip them to keep it simple
    }
    
    // Expose fetch if permitted
    if (permissions.includes('fetch')) {
      const fetchHandle = context.newFunction('fetch', async (urlHandle, optionsHandle) => {
        const url = context.getString(urlHandle)
        // Validate URL (no internal networks, etc.)
        if (isInternalUrl(url)) {
          throw new Error('Access to internal URLs is not allowed')
        }
        
        // Call native fetch
        const response = await fetch(url)
        const text = await response.text()
        
        return context.newString(text)
      })
      context.setProp(global, 'fetch', fetchHandle)
    }
    
    // Expose storage if permitted
    if (permissions.includes('storage')) {
      const storageHandle = context.newObject()
      
      const getHandle = context.newFunction('get', async (keyHandle) => {
        const key = context.getString(keyHandle)
        // Implement storage.get logic here
        return context.newString('') // placeholder
      })
      
      const setHandle = context.newFunction('set', async (keyHandle, valueHandle) => {
        const key = context.getString(keyHandle)
        const value = context.getString(valueHandle)
        // Implement storage.set logic here
        return context.undefined
      })
      
      context.setProp(storageHandle, 'get', getHandle)
      context.setProp(storageHandle, 'set', setHandle)
      context.setProp(global, 'storage', storageHandle)
    }
    
    // Wrap the code in a function that returns the extension object
    const wrappedCode = `
      ${code}
      // Return the extension object if it was assigned to 'module.exports' or 'exports'
      if (typeof module !== 'undefined' && module.exports) {
        module.exports
      } else if (typeof exports !== 'undefined') {
        exports
      } else {
        // Try to find a global extension object
        typeof extension !== 'undefined' ? extension : {}
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
