import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

let _client: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) _client = createClient(url, key);
  }
  return _client;
}

const BUCKET_NAME = "ai-generated-scenes";

export interface AiAssetEntry {
  id: string;
  name: string;
  path: string;
  tags: string[];
  description: string;
  userId?: string;
  createdAt?: string;
  sceneData?: any;
}

export async function uploadAiAssetEntry(entry: AiAssetEntry & { body?: string; contentType?: string }) {
  try {
    // Ensure bucket exists
    const { data: buckets } = await sb()!.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      await sb()!.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10 // 10MB
      });
    }
    
    // Upload scene data to Supabase storage
    if (entry.body && entry.contentType) {
      const filePath = `scenes/${entry.id}.json`;
      const { error: uploadError } = await sb()!.storage
        .from(BUCKET_NAME)
        .upload(filePath, entry.body, {
          contentType: entry.contentType,
          upsert: true
        });
      
      if (uploadError) {
        logger.error("Failed to upload scene to Supabase:", uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = sb()!.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      entry.path = publicUrl;
    }
    
    // Save metadata to scenes table
    const { error: dbError } = await sb()!
      .from("scenes")
      .upsert({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        category: "ai-generated",
        tags: entry.tags,
        user_id: entry.userId,
        data: entry.sceneData || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    
    if (dbError) {
      logger.error("Failed to save scene metadata:", dbError);
      throw dbError;
    }
    
    return { success: true, entry, publicUrl: entry.path };
    
  } catch (error) {
    logger.error("Failed to upload AI asset:", error);
    return { success: false, error };
  }
}

export async function listAiGeneratedScenes(limit = 50) {
  try {
    const { data, error } = await sb()!
      .from("scenes")
      .select("*")
      .eq("category", "ai-generated")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error("Failed to list AI scenes:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error("Failed to fetch AI scenes:", error);
    return [];
  }
}

export async function getAiAssetContext() {
  const scenes = await listAiGeneratedScenes(20);
  return JSON.stringify(scenes);
}
