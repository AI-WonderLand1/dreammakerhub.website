import { supabaseServer } from "@/lib/supabaseServer";

export async function listProjects(userId: string) {
  const { data, error } = await supabaseServer
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
