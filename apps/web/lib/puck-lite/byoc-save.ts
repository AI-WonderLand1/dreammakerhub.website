/**
 * Puck Editor BYOC Save System
 * Uses StorageManager with BYOC for saving/loading Puck layouts
 */

import { StorageManager } from "@/lib/storage/StorageManager";
import { BYOCConfig } from "@/lib/storage/types";
import { logger } from '@/lib/logger';

export interface PuckProjectData {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root: { type: string; props: Record<string, unknown> };
  meta: {
    title?: string;
    description?: string;
    thumbnail?: string;
  };
}

export interface PuckSaveOptions {
  userId: string;
  projectId: string;
  projectName?: string;
  mode?: 'supabase' | 'byoc' | 'hybrid';
}

let storageManager: StorageManager | null = null;

export function initPuckStorage(mode: 'supabase' | 'byoc' | 'hybrid' = 'supabase', byocConfig?: BYOCConfig) {
  storageManager = new StorageManager(mode, byocConfig);
  return storageManager;
}

export function getPuckStorage(): StorageManager | null {
  return storageManager;
}

export async function savePuckProject(
  data: PuckProjectData,
  options: PuckSaveOptions
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const storage = getPuckStorage();
    if (!storage) {
      return { success: false, error: "Storage not initialized" };
    }

    const result = await storage.saveProject(
      options.projectId,
      data,
      options.userId
    );

    return { success: true, url: result.url };
  } catch (error) {
    logger.error("[PuckSave] Failed to save:", error);
    return { success: false, error: String(error) };
  }
}

export async function loadPuckProject(
  projectId: string,
  userId: string
): Promise<{ success: boolean; data?: PuckProjectData; error?: string }> {
  try {
    const storage = getPuckStorage();
    if (!storage) {
      return { success: false, error: "Storage not initialized" };
    }

    const result = await storage.loadProject(projectId);
    
    if (!result) {
      return { success: false, error: "Project not found" };
    }

    return { success: true, data: result as PuckProjectData };
  } catch (error) {
    logger.error("[PuckSave] Failed to load:", error);
    return { success: false, error: String(error) };
  }
}

export async function deletePuckProject(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = getPuckStorage();
    if (!storage) {
      return { success: false, error: "Storage not initialized" };
    }

    await storage.deleteProject(projectId, userId);
    return { success: true };
  } catch (error) {
    logger.error("[PuckSave] Failed to delete:", error);
    return { success: false, error: String(error) };
  }
}
