// Simple in-memory store for generated scenes
// In production, this would be Supabase

const sceneMemoryStore = new Map<string, object>();

export async function saveSceneToMemory(sceneId: string, scene: object): Promise<void> {
  sceneMemoryStore.set(sceneId, scene);
}

export async function loadSceneFromMemory(sceneId: string): Promise<object | null> {
  return sceneMemoryStore.get(sceneId) || null;
}

export async function deleteSceneFromMemory(sceneId: string): Promise<void> {
  sceneMemoryStore.delete(sceneId);
}

export function getAllScenes(): Map<string, object> {
  return sceneMemoryStore;
}