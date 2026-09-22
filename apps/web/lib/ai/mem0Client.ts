import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// This legacy name refers to Supabase Storage, not the external Mem0 SDK.
export function isMem0Enabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
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

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  // Keep the service role on the server. All reads are scoped to the verified
  // caller's user ID by the API route; never accept a user ID from query params.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function toRecord(confession: StoredConfession) {
  return {
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
}

function fromRecord(value: Record<string, unknown>): StoredConfession | null {
  if (typeof value.trace_id !== "string" || typeof value.user_id !== "string" ||
      typeof value.truth !== "string" || typeof value.created_at !== "string") return null;
  return {
    userId: value.user_id,
    projectId: typeof value.project_id === "string" ? value.project_id : "",
    traceId: value.trace_id,
    type: typeof value.type === "string" ? value.type : "TRANSPARENCY",
    title: typeof value.title === "string" ? value.title : "Confession",
    detail: typeof value.detail === "string" ? value.detail : "",
    truth: value.truth,
    what: typeof value.what === "string" ? value.what : "",
    why: typeof value.why === "string" ? value.why : "",
    how: typeof value.how === "string" ? value.how : "",
    impactLevel: typeof value.impact_level === "string" ? value.impact_level : "low",
    machineTags: Array.isArray(value.machine_tags) ? value.machine_tags.filter((tag): tag is string => typeof tag === "string") : [],
    createdAt: value.created_at,
  };
}

export async function storeConfessionToMem0(confession: StoredConfession): Promise<boolean> {
  const supabase = getStorageClient();
  if (!supabase) return false;
  if (!/^[0-9a-f-]{36}$/i.test(confession.userId) || !/^[\w-]+$/.test(confession.projectId)) {
    logger.error("Invalid confession storage identifiers");
    return false;
  }

  const date = new Date().toISOString().slice(0, 10);
  // Flat sitewide entries are easy to list. Project entries retain the legacy
  // directory structure, but use unique filenames so one turn cannot overwrite
  // a second confession from the same trace.
  const prefix = confession.projectId === "sitewide"
    ? `users/${confession.userId}/`
    : `users/${confession.userId}/projects/${confession.projectId}/${date}/`;
  const path = `${prefix}${confession.traceId}-${randomUUID()}.json`;
  const body = JSON.stringify(toRecord(confession));
  try {
    const { error } = await supabase.storage.from(CONFESSIONS_BUCKET)
      .upload(path, body, { contentType: "application/json", upsert: false });
    if (!error) return true;

    // Storage buckets must be private. If it already exists, the create call
    // fails harmlessly and the retry still reports the real upload result.
    const { error: bucketError } = await supabase.storage.createBucket(CONFESSIONS_BUCKET, {
      public: false, fileSizeLimit: 5242880,
    });
    if (bucketError) logger.warn("Confession bucket creation not needed or failed", { message: bucketError.message });
    const { error: retryError } = await supabase.storage.from(CONFESSIONS_BUCKET)
      .upload(path, body, { contentType: "application/json", upsert: false });
    if (retryError) {
      logger.error("Confession storage failed", { message: retryError.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Confession storage failed", { kind: error instanceof Error ? error.name : "unknown" });
    return false;
  }
}

// Storage.list() returns immediate children only. Walk bounded directory levels
// so older /projects/{id}/{date} records are actually discoverable.
async function loadConfessions(userId: string, projectId?: string, maxFiles = 200): Promise<StoredConfession[]> {
  const supabase = getStorageClient();
  if (!supabase) throw new Error("Confession storage is not configured");
  const root = `users/${userId}/`;
  const folders = projectId && projectId !== "sitewide"
    ? [`${root}projects/${projectId}/`]
    : [root];
  const found: StoredConfession[] = [];
  let inspected = 0;

  while (folders.length && inspected < maxFiles) {
    const prefix = folders.shift()!;
    // Bound both listing and downloads: one bad directory cannot hold the API
    // open indefinitely. New sitewide records are in the first directory.
    for (let offset = 0; offset < 300 && inspected < maxFiles; offset += 100) {
      const { data: entries, error } = await supabase.storage.from(CONFESSIONS_BUCKET)
        .list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "desc" } });
      if (error) throw new Error("Could not list confession storage");
      if (!entries?.length) break;
      for (const entry of entries) {
        if (inspected >= maxFiles) break;
        const path = `${prefix}${entry.name}`;
        if (entry.name.endsWith(".json")) {
          inspected++;
          const { data, error: downloadError } = await supabase.storage.from(CONFESSIONS_BUCKET).download(path);
          if (downloadError || !data) continue;
          try {
            const record = fromRecord(JSON.parse(await data.text()) as Record<string, unknown>);
            if (record?.userId === userId && (!projectId || record.projectId === projectId)) found.push(record);
          } catch {
            logger.warn("Skipping malformed confession record");
          }
        } else if (!entry.id && folders.length < 300) {
          folders.push(`${path}/`);
        }
      }
      if (entries.length < 100) break;
    }
  }
  return found.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUserConfessions(userId: string, projectId?: string, limit = 50): Promise<StoredConfession[]> {
  return (await loadConfessions(userId, projectId, Math.max(100, Math.min(limit, 100) * 10))).slice(0, limit);
}

export async function searchMem0Confessions(userId: string, query: string, limit = 10): Promise<StoredConfession[]> {
  const term = query.trim().toLowerCase();
  const records = await loadConfessions(userId, undefined, 500);
  return records.filter((entry) => [entry.title, entry.detail, entry.truth, entry.what, entry.why, entry.how]
    .some((value) => value.toLowerCase().includes(term))).slice(0, limit);
}

export async function getMem0Client() {
  return { store: storeConfessionToMem0, search: searchMem0Confessions, getAll: getUserConfessions };
}
