import { VM } from 'vm2'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { env, requireEnv } from '@lib/env'

let supabase: ReturnType<typeof createClient> | null = null

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
    sandbox: createSandbox(data.manifest.permissions)
  })

  const extension = vm.run(decrypted)

  return extension.hooks || {}
}

function createSandbox(permissions: string[]) {
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
