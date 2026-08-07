import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const memoryStore = new Map<string, object>();

let _client: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) _client = createClient(url, key);
  }
  return _client;
}

export async function saveSceneToSupabase(
  sceneId: string,
  sceneData: { name?: string; [key: string]: unknown },
  userId?: string
): Promise<{ success: boolean; path?: string }> {
  if (!sb()) {
    logger.warn("Supabase not configured, falling back to memory");
    memoryStore.set(sceneId, sceneData);
    return { success: true };
  }

  try {
    const { data, error } = await sb()!
      .from("scenes")
      .upsert({
        id: sceneId,
        user_id: userId || null,
        name: sceneData.name || "Untitled Scene",
        data: sceneData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      path: `scenes/${sceneId}`
    };
  } catch (error) {
    logger.error("Failed to save to Supabase:", error);
    memoryStore.set(sceneId, sceneData);
    return { success: true };
  }
}

export async function loadSceneFromSupabase(sceneId: string): Promise<object | null> {
  if (!sb()) {
    return memoryStore.get(sceneId) || null;
  }

  try {
    const { data, error } = await sb()!
      .from("scenes")
      .select("data")
      .eq("id", sceneId)
      .single();

    if (error) throw error;
    return (data as { data?: object } | null)?.data ?? null;
  } catch (error) {
    logger.error("Failed to load from Supabase:", error);
    return memoryStore.get(sceneId) || null;
  }
}

export async function listUserScenes(userId: string): Promise<any[]> {
  if (!sb()) {
    return [];
  }

  try {
    const { data, error } = await sb()!
      .from("scenes")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Failed to list scenes:", error);
    return [];
  }
}

export async function listPublicScenes(limit = 20): Promise<any[]> {
  if (!sb()) {
    return [];
  }

  try {
    const { data, error } = await sb()!
      .from("scenes")
      .select("id, name, data, created_at, updated_at, is_public")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Failed to list public scenes:", error);
    return [];
  }
}

export async function deleteSceneFromSupabase(sceneId: string): Promise<boolean> {
  if (!sb()) {
    memoryStore.delete(sceneId);
    return true;
  }

  try {
    const { error } = await sb()!
      .from("scenes")
      .delete()
      .eq("id", sceneId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error("Failed to delete from Supabase:", error);
    return false;
  }
}
