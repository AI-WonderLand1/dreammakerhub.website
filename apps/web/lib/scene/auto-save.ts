'use client';

import { useEffect, useRef, useCallback } from 'react';
import { persistScene } from './persist-scene-client';
import { logger } from '@/lib/logger';

export interface UseAutoSaveOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export interface SceneData {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export function useAutoSave(
  sceneId: string | null,
  sceneData: SceneData,
  userId?: string,
  options: UseAutoSaveOptions = {}
) {
  const { intervalMs = 30000, enabled = true } = options;
  const lastSavedRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveNow = useCallback(async () => {
    if (!sceneId || !sceneData) return false;

    const serialized = JSON.stringify(sceneData);
    if (serialized === lastSavedRef.current) return true;

    if (!userId) return false;
    const saved = await persistScene(sceneId, sceneData);
    if (saved) {
      lastSavedRef.current = serialized;
      logger.info('[AutoSave] Saved:', sceneId);
    } else {
      logger.warn('[AutoSave] Scene not persisted:', sceneId);
    }
    return saved;
  }, [sceneId, sceneData, userId]);

  useEffect(() => {
    if (!enabled || !sceneId) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, intervalMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sceneData, intervalMs, enabled, sceneId, saveNow]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveNow,
    lastSaved: lastSavedRef.current,
  };
}

export function cleanSceneData(sceneData: SceneData): SceneData {
  const cleaned = { ...sceneData };

  delete cleaned.userId;
  delete cleaned.tempData;
  delete cleaned._draft;
  delete cleaned._cache;

  // Primitive geometry has no meshUrl; do not silently delete it.
  if (Array.isArray(cleaned.objects)) {
    cleaned.objects = cleaned.objects.filter((obj: { meshUrl?: string }) => {
      return obj && (typeof obj.meshUrl !== 'string' || !obj.meshUrl.includes('__temp'));
    });
  }

  if (cleaned.materials) {
    cleaned.materials = cleaned.materials.filter((mat: { id?: string }) => {
      return mat.id && !mat.id.startsWith('__');
    });
  }

  return cleaned;
}