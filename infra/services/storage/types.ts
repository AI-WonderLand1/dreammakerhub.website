export type StorageFileInput = Buffer | Blob | ArrayBuffer | string

export interface StorageErrorLike {
  message: string
  statusCode?: string
  error?: string
}

export interface StorageOperationResult<TData> {
  data: TData | null
  error: StorageErrorLike | null
}

export interface StorageUploadData {
  path: string
  id: string
  fullPath: string
}

export interface StorageListItem {
  id?: string | null
  name: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
}

export interface StorageRemovedItem {
  name: string
}

export interface StorageProvider {
  upload(path: string, file: StorageFileInput): Promise<StorageOperationResult<StorageUploadData>>
  download(path: string): Promise<StorageOperationResult<Blob>>
  remove(path: string): Promise<StorageOperationResult<StorageRemovedItem[]>>
  list(path: string): Promise<StorageOperationResult<StorageListItem[]>>
}
