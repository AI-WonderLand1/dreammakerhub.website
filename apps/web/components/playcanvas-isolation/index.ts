// Main component
export { IsolatedPlayCanvas, useIsolatedPlayCanvas } from './client/IsolatedPlayCanvas';
export type { IsolatedPlayCanvasProps } from './client/IsolatedPlayCanvas';

// Client
export { PlayCanvasClient, createPlayCanvasClient } from './client/PlayCanvasClient';
export type { PlayCanvasClientConfig } from './client/PlayCanvasClient';

// Container management
export { PlayCanvasContainerManager } from './webcontainer/PlayCanvasContainer';

// Service worker
export { 
  registerPlayCanvasServiceWorker, 
  registerContainer,
  USER_CONTAINER_MAP,
  REQUEST_CACHE
} from './service-worker/playcanvas-sw';

// Utilities
export { getCurrentUserSession, requireUserSession, validateUserSession } from './utils/auth';
export { hashForIsolation, generateContainerId, createUserPath } from './utils/hashing';
export { generateSSHKeyPair, getOrCreateSSHKey, validateSSHKey, isKeyExpired, revokeSSHKey, getUserSSHKey } from './utils/ssh-keys';
export type { SSHKeyPair } from './utils/ssh-keys';

// Types
export type { 
  UserSession, 
  IsolationConfig, 
  UserIsolation, 
  WebContainerInstance,
  RouteRequest,
  RouteResponse,
  CacheEntry
} from './types/isolation';

export type {
  PlayCanvasScene,
  PlayCanvasObject,
  PlayCanvasLight,
  PlayCanvasCamera,
  PlayCanvasMaterial,
  PlayCanvasEditorConfig,
  PlayCanvasAsset,
  PlayCanvasSaveRequest,
  PlayCanvasSaveResponse,
  PlayCanvasExportRequest,
  PlayCanvasExportResponse
} from './types/playcanvas';