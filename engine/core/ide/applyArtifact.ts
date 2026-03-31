import { FileSystemManager } from './filesystem';
import { PersistenceManager } from './persistence';
import { logger } from '@lib/logger';

export class ArtifactManager {
  static async apply(platform: string, code: string, projectId: string) {
    logger.info(`[Artifact] Applying changes`, { platform, projectId, codeLength: code.length });
    
    // 1. Write to local disk
    await FileSystemManager.saveFile(`app/(builder)/wonder-build/builder/canvas/${platform}Canvas.tsx`, code);
    
    // 2. Sync to Cloud & MEGA
    await PersistenceManager.autoSave('wonder-build', platform, code, projectId);
    
    return { success: true, timestamp: Date.now() };
  }
}

export const applyArtifact = ArtifactManager.apply;
