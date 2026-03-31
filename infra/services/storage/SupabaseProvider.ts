import { createClient } from '@infra/lib/supabase/server-client'
import type {
  StorageFileInput,
  StorageListItem,
  StorageOperationResult,
  StorageProvider,
  StorageRemovedItem,
  StorageUploadData,
} from '@infra/services/storage/types'

interface SupabaseStorageConfig {
  bucket: string
  upsert: boolean
  listLimit: number
}

const DEFAULT_CONFIG: SupabaseStorageConfig = {
  bucket: 'projects',
  upsert: true,
  listLimit: 1000,
}

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  return fallback
}

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function getSupabaseStorageConfig(): SupabaseStorageConfig {
  return {
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_CONFIG.bucket,
    upsert: readBooleanEnv(process.env.SUPABASE_STORAGE_UPSERT, DEFAULT_CONFIG.upsert),
    listLimit: readNumberEnv(process.env.SUPABASE_STORAGE_LIST_LIMIT, DEFAULT_CONFIG.listLimit),
  }
}

export function createSupabaseStorageProvider(config?: Partial<SupabaseStorageConfig>): StorageProvider {
  const resolvedConfig: SupabaseStorageConfig = {
    ...getSupabaseStorageConfig(),
    ...config,
  }

  return {
    async upload(path: string, file: StorageFileInput): Promise<StorageOperationResult<StorageUploadData>> {
      return createClient().storage
        .from(resolvedConfig.bucket)
        .upload(path, file, { upsert: resolvedConfig.upsert })
    },

    async download(path: string): Promise<StorageOperationResult<Blob>> {
      return createClient().storage.from(resolvedConfig.bucket).download(path)
    },

    async remove(path: string): Promise<StorageOperationResult<StorageRemovedItem[]>> {
      return createClient().storage.from(resolvedConfig.bucket).remove([path])
    },

    async list(path: string): Promise<StorageOperationResult<StorageListItem[]>> {
      return createClient().storage.from(resolvedConfig.bucket).list(path, { limit: resolvedConfig.listLimit })
    },
  }
}

export const SupabaseStorageProvider = createSupabaseStorageProvider()

export const SupabaseProvider = {
  getClient: () => createClient(),
}
