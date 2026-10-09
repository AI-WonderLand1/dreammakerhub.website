"use client";

import { ensureSupabaseConfig, getSupabaseClient } from "@/lib/supabase/client";

export async function persistScene(sceneId: string, scene: Record<string, unknown>): Promise<boolean> {
  await ensureSupabaseConfig();
  const client = getSupabaseClient();
  if (!client) return false;
  const { data, error } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) return false;

  try {
    const response = await fetch("/api/scenes/save", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ sceneId, data: scene }),
    });
    const result = await response.json().catch(() => null);
    return response.ok && result?.success === true && typeof result.path === "string";
  } catch {
    return false;
  }
}
