/**
 * Storage Types for AI-WONDERLAND
 * Supports both Supabase and BYOC (Bring Your Own Cloud)
 */

export type StorageMode = 'supabase' | 'byoc' | 'hybrid';

export interface StorageProvider {
  type: StorageMode;
  isActive: boolean;
  config?: BYOCConfig;
}

export interface BYOCConfig {
  provider: 'aws-s3' | 'google-cloud' | 'custom';
  credentials: BYOCCredentials;
  endpoints?: CustomEndpoints;
  enabled: boolean;
  validatedAt?: number;
}

export interface BYOCCredentials {
  accessKey?: string;
  secretKey?: string;
  bucketName?: string;
  region?: string;
  projectId?: string;
  apiKey?: string;
}

export interface CustomEndpoints {
  saveProject?: string;
  loadProject?: string;
  deleteProject?: string;
  listProjects?: string;
  vercelFunction?: string;
  firebaseFunction?: string;
}

export interface StorageMetadata {
  projectId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  ttl?: number; // Time to live in hours (for temp storage)
  provider: StorageMode;
}

export interface TempStorageConfig {
  enabled: boolean;
  ttlHours: number; // Default 24
  bucketName: string;
  cleanupInterval: number; // ms
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: 'model' | 'shader' | 'texture' | 'scene' | 'config';
  url: string;
  size: number;
  metadata: StorageMetadata;
}
