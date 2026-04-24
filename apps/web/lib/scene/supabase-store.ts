import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function saveSceneToSupabase(sceneId: string, sceneData: object, userId?: string): Promise<{ success: boolean; path?: string }> {
  if (!supabase) {
    console.warn("Supabase not configured, falling back to memory");
    const { saveSceneToMemory } = await import("./memory-store");
    await saveSceneToMemory(sceneId, sceneData);
    return { success: true };
  }

  try {
    const { data, error } = await supabase
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
    console.error("Failed to save to Supabase:", error);
    // Fallback to memory
    const { saveSceneToMemory } = await import("./memory-store");
    await saveSceneToMemory(sceneId, sceneData);
    return { success: true };
  }
}

export async function loadSceneFromSupabase(sceneId: string): Promise<object | null> {
  if (!supabase) {
    const { loadSceneFromMemory } = await import("./memory-store");
    return loadSceneFromMemory(sceneId);
  }

  try {
    const { data, error } = await supabase
      .from("scenes")
      .select("data")
      .eq("id", sceneId)
      .single();

    if (error) throw error;
    return data?.data || null;
  } catch (error) {
    console.error("Failed to load from Supabase:", error);
    // Fallback to memory
    const { loadSceneFromMemory } = await import("./memory-store");
    return loadSceneFromMemory(sceneId);
  }
}

export async function listUserScenes(userId: string): Promise<any[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("scenes")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to list scenes:", error);
    return [];
  }
}

export async function listPublicScenes(limit = 20): Promise<any[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("scenes")
      .select("id, name, data, created_at, updated_at, is_public")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to list public scenes:", error);
    return [];
  }
}

export async function deleteSceneFromSupabase(sceneId: string): Promise<boolean> {
  if (!supabase) {
    const { deleteSceneFromMemory } = await import("./memory-store");
    deleteSceneFromMemory(sceneId);
    return true;
  }

  try {
    const { error } = await supabase
      .from("scenes")
      .delete()
      .eq("id", sceneId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to delete from Supabase:", error);
    return false;
  }
}