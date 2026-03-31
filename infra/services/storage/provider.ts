import { createSupabaseStorageProvider } from '@infra/services/storage/SupabaseProvider'
import type { StorageProvider } from '@infra/services/storage/types'

export type StorageProviderKind = 'supabase'

export interface StorageProviderFactoryContext {
  tenantId?: string
  provider?: StorageProviderKind
}

function resolveStorageProviderKind(context?: StorageProviderFactoryContext): StorageProviderKind {
  if (context?.provider) {
    return context.provider
  }

  const envProvider = process.env.STORAGE_PROVIDER?.trim().toLowerCase()
  if (envProvider === 'supabase') {
    return 'supabase'
  }

  return 'supabase'
}

export function createStorageProvider(context?: StorageProviderFactoryContext): StorageProvider {
  const providerKind = resolveStorageProviderKind(context)

  switch (providerKind) {
    case 'supabase':
    default:
      return createSupabaseStorageProvider()
  }
}

export const storageProvider = createStorageProvider()
