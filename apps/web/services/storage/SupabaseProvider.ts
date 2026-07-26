import { createClient } from "@supabase/supabase-js";
import { getSecretFromVault } from "@/lib/oracle-vault";

let supabase: ReturnType<typeof createClient> | null = null;

async function getSupabaseClient() {
  if (!supabase) {
    const [supabaseUrl, supabaseAnonKey] = await Promise.all([
      getSecretFromVault('NEXT_PUBLIC_SUPABASE_URL'),
      getSecretFromVault('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    ]);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase credentials in Oracle Vault");
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabase;
}

export const SupabaseStorageProvider = {
  async upload(path: string, file: Buffer) {
    const client = await getSupabaseClient();
    const { data, error } = await client.storage
      .from("projects")
      .upload(path, file, { upsert: true });

    if (error) throw error;
    return data;
  },

  async download(path: string) {
    const client = await getSupabaseClient();
    const { data, error } = await client.storage
      .from("projects")
      .download(path);

    if (error) throw error;
    return data;
  },

  async remove(path: string) {
    const client = await getSupabaseClient();
    const { error } = await client.storage
      .from("projects")
      .remove([path]);

    if (error) throw error;
  },

  async list(path: string) {
    const client = await getSupabaseClient();
    const { data, error } = await client.storage.from("projects").list(path, {
      limit: 1000,
    });

    return { data, error };
  },
};
