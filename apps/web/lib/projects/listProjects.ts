import { supabaseServer } from "@/lib/supabaseServer";

export async function listProjects(userId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
