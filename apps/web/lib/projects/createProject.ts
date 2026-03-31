import { supabaseServer } from "@/lib/supabaseServer";
import type { EngineType } from "@/types/db";

export async function createProject(
  userId: string,
  name: string,
  engine: EngineType
) {
  const { data, error } = await supabaseServer
    .from("projects")
    .insert({
      user_id: userId,
      name,
      engine,
      metadata: {}
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

