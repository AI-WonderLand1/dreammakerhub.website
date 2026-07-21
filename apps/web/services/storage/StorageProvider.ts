// apps/web/services/storage/StorageProvider.ts
import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars for storage");
    supabase = createClient(url, key);
  }
  return supabase;
}

export interface StorageProvider {
  upload(path: string, data: Buffer, contentType?: string): Promise<void>;
  download(path: string): Promise<Buffer | null>;
  exists(path: string): Promise<boolean>;
}

export const SupabaseStorageProvider: StorageProvider = {
  async upload(path: string, data: Buffer, contentType?: string) {
    const { error } = await getClient().storage
      .from("projects")
      .upload(path, data, { upsert: true, contentType });
    if (error) throw error;
  },

  async download(path: string) {
    const { data, error } = await getClient().storage
      .from("projects")
      .download(path);
    if (error) return null;
    return Buffer.from(await data.arrayBuffer());
  },

  async exists(path: string) {
    const { data, error } = await getClient().storage
      .from("projects")
      .list(path.split("/").slice(0, -1).join("/") || ".", {
        limit: 1,
        search: path.split("/").pop(),
      });
    return !error && (data?.length ?? 0) > 0;
  },
};
