'use client';

import { useEffect, useRef, useCallback } from 'react';
import { saveSceneToSupabase } from './supabase-store';

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

    const result = await saveSceneToSupabase(sceneId, sceneData, userId);
    if (result.success) {
      lastSavedRef.current = serialized;
      console.log('[AutoSave] Saved:', sceneId);
    }
    return result.success;
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

  if (cleaned.objects) {
    cleaned.objects = cleaned.objects.filter((obj: { meshUrl?: string }) => {
      return obj.meshUrl && !obj.meshUrl.includes('__temp');
    });
  }

  if (cleaned.materials) {
    cleaned.materials = cleaned.materials.filter((mat: { id?: string }) => {
      return mat.id && !mat.id.startsWith('__');
    });
  }

  return cleaned;
}