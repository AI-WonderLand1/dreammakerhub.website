import { supabaseRouteClient } from "../supabase/route";

export function isMem0Enabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export interface StoredConfession {
  id?: number;
  userId: string;
  projectId: string;
  traceId: string;
  type: string;
  title: string;
  detail: string;
  truth: string;
  what: string;
  why: string;
  how: string;
  impactLevel: string;
  machineTags?: string[];
  createdAt: string;
}

const CONFESSIONS_BUCKET = "ai-confessions";

export async function storeConfessionToMem0(
  confession: StoredConfession
): Promise<boolean> {
  try {
    const supabase = supabaseRouteClient();
    
    const bucket = CONFESSIONS_BUCKET;
    const date = new Date().toISOString().slice(0, 10);
    const path = `users/${confession.userId}/projects/${confession.projectId}/${date}/${confession.traceId}.json`;

    const record = {
      user_id: confession.userId,
      project_id: confession.projectId,
      trace_id: confession.traceId,
      type: confession.type,
      title: confession.title,
      detail: confession.detail,
      truth: confession.truth,
      what: confession.what,
      why: confession.why,
      how: confession.how,
      impact_level: confession.impactLevel,
      machine_tags: confession.machineTags || [],
      created_at: confession.createdAt,
    };

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, JSON.stringify(record), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.log("[Mem0] Storage upload failed, trying to create bucket:", error.message);
      
      await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 5242880,
      });

      const { error: retryError } = await supabase.storage
        .from(bucket)
        .upload(path, JSON.stringify(record), {
          contentType: "application/json",
          upsert: true,
        });

      if (retryError) {
        console.error("[Mem0] Failed to store confession:", retryError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("[Mem0] Failed to store confession:", error);
    return false;
  }
}

export async function searchMem0Confessions(
  userId: string,
  query: string,
  limit: number = 10
): Promise<StoredConfession[]> {
  try {
    const supabase = supabaseRouteClient();
    const bucket = CONFESSIONS_BUCKET;

    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(`users/${userId}/`, { limit });

    if (error || !files) {
      console.log("[Mem0] No confessions found:", error?.message);
      return [];
    }

    const confessions: StoredConfession[] = [];
    const queryLower = query.toLowerCase();

    for (const file of files) {
      if (confessions.length >= limit) break;

      const { data } = await supabase.storage
        .from(bucket)
        .download(`users/${userId}/${file.name}`);

      if (data) {
        const text = await data.text();
        try {
          const record = JSON.parse(text);
          const searchText = `${record.title} ${record.truth} ${record.what} ${record.why} ${record.how}`.toLowerCase();
          
          if (searchText.includes(queryLower)) {
            confessions.push({
              userId: record.user_id,
              projectId: record.project_id,
              traceId: record.trace_id,
              type: record.type,
              title: record.title,
              detail: record.detail,
              truth: record.truth,
              what: record.what,
              why: record.why,
              how: record.how,
              impactLevel: record.impact_level,
              machineTags: record.machine_tags,
              createdAt: record.created_at,
            });
          }
        } catch (e) {
          console.log("[Mem0] Failed to parse confession file:", e);
        }
      }
    }

    return confessions;
  } catch (error) {
    console.error("[Mem0] Failed to search confessions:", error);
    return [];
  }
}

export async function getUserConfessions(
  userId: string,
  projectId?: string,
  limit: number = 50
): Promise<StoredConfession[]> {
  try {
    const supabase = supabaseRouteClient();
    const bucket = CONFESSIONS_BUCKET;

    const prefix = projectId
      ? `users/${userId}/projects/${projectId}/`
      : `users/${userId}/`;

    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: limit * 10 });

    if (error || !files) {
      console.log("[Mem0] No confessions found:", error?.message);
      return [];
    }

    const confessions: StoredConfession[] = [];

    for (const file of files) {
      if (confessions.length >= limit) break;

      const { data } = await supabase.storage
        .from(bucket)
        .download(`${prefix}${file.name}`);

      if (data) {
        const text = await data.text();
        try {
          const record = JSON.parse(text);
          confessions.push({
            userId: record.user_id,
            projectId: record.project_id,
            traceId: record.trace_id,
            type: record.type,
            title: record.title,
            detail: record.detail,
            truth: record.truth,
            what: record.what,
            why: record.why,
            how: record.how,
            impactLevel: record.impact_level,
            machineTags: record.machine_tags,
            createdAt: record.created_at,
          });
        } catch (e) {
          console.log("[Mem0] Failed to parse confession file:", e);
        }
      }
    }

    return confessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("[Mem0] Failed to get user confessions:", error);
    return [];
  }
}

export async function getMem0Client() {
  return {
    store: storeConfessionToMem0,
    search: searchMem0Confessions,
    getAll: getUserConfessions,
  };
}
