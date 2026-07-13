/**
 * Core types for the Gaussian Splatting pipeline.
 *
 * The pipeline flow is:
 *   Upload photos/videos → Create job → Dispatch training → Poll status → Save .ply/.splat → Display
 */

export type SplatJobStatus = 'pending' | 'uploading' | 'processing' | 'training' | 'completed' | 'failed'

export interface SplatJob {
  id: string
  projectId: string
  userId: string
  status: SplatJobStatus
  sourceType: 'photos' | 'video'
  sourceAssetUrls: string[]
  resultUrl?: string
  resultFormat?: 'ply' | 'splat' | 'ksplat'
  progress?: number
  error?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface UploadResult {
  assetId: string
  url: string
  path: string
  mimeType: string
  size: number
}

export interface TrainRequest {
  jobId: string
  sourceAssetUrls: string[]
  options?: {
    format?: 'ply' | 'splat' | 'ksplat'
    quality?: 'low' | 'medium' | 'high'
    maxIterations?: number
  }
}

export interface TrainResult {
  jobId: string
  status: SplatJobStatus
  resultUrl?: string
  resultFormat?: 'ply' | 'splat' | 'ksplat'
  error?: string
}
