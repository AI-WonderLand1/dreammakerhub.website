export interface UserSession {
  userId: string;
  email?: string;
  hashedId: string; // For filesystem isolation
  token: string;
  expiresAt: number;
}

export interface IsolationConfig {
  maxInstances: number;
  instanceTimeoutMs: number;
  enableCaching: boolean;
  cacheSizeMB: number;
  cleanupIntervalMs: number;
}

export interface UserIsolation {
  userId: string;
  containerId: string;
  filesystemPath: string;
  createdAt: number;
  lastAccessed: number;
  isActive: boolean;
}

export interface RouteRequest {
  url: string;
  userId: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface RouteResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  userId: string;
  containerId: string;
}

export interface CacheEntry {
  url: string;
  response: Response;
  userId: string;
  timestamp: number;
  ttl: number;
}

export interface WebContainerInstance {
  id: string;
  userId: string;
  container: any; // WebContainer type
  serverUrl: string;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}