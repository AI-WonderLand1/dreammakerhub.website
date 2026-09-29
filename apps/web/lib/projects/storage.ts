import "server-only";
import path from "path";
import { headers } from "next/headers";
import { createClient as createBearerClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export type ProjectMetadata = {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishEnabled?: boolean;
  customDomain?: string | null;
  lastPublishId?: string | null;
  tool?: string;
};

type FileEntry = {
  path: string;
  content?: string;
};

export type Revision = {
  id: string;
  versionNumber: number;
  snapshot: unknown;
  createdAt: string;
};

type ProjectRow = {
  id: string;
  owner_id: string;
  name: string;
  tool: string | null;
  publish_enabled: boolean | null;
  custom_domain: string | null;
  last_publish_id: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeFilePath(filePath: string) {
  const normalized = path.posix.normalize(filePath).replace(/^\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("..")) throw new Error("Invalid path");
  return normalized;
}

// Internal metadata is never a user-importable/movable code path.
export function isReservedWonderSpacePath(filePath: string): boolean {
  return filePath === ".wonderspace" || filePath.startsWith(".wonderspace/");
}

/** One owner check and one filtered query for native issues/discussions. */
export async function listInternalProjectFilesByPrefix(
  projectId: string, ownerId: string, prefix: string, limit = 251,
): Promise<Array<{ path: string; content: string }>> {
  if (prefix !== ".wonderspace/work-items/issue/" &&
      prefix !== ".wonderspace/work-items/discussion/") {
    throw new Error("Invalid internal project prefix");
  }
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase.from("_project_files")
    .select("file_path,content").eq("project_id", projectId)
    .like("file_path", `${prefix}%`)
    .order("file_path", { ascending: true })
    .limit(Math.min(Math.max(1, Math.floor(limit)), 251));
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({ path: String(row.file_path), content: String(row.content ?? "") }));
}

/** Owner-scoped compare-and-swap; retry concurrent updates instead of losing comments. */
export async function updateProjectFileAtomically(
  projectId: string, ownerId: string, filePath: string,
  mutate: (previousContent: string) => string,
): Promise<string> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  if (!isReservedWonderSpacePath(normalized)) throw new Error("Invalid internal project path");
  const supabase = await getClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: current, error: readError } = await supabase.from("_project_files")
      .select("content,updated_at").eq("project_id", projectId)
      .eq("file_path", normalized).maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("ITEM_NOT_FOUND");
    const nextContent = mutate(String(current.content ?? ""));
    const previousTimestamp = String(current.updated_at);
    const previousMs = Date.parse(previousTimestamp);
    if (!Number.isFinite(previousMs)) throw new Error("Invalid project timestamp");
    // Ensure the row's version always advances, including same-millisecond writes.
    const updatedAt = new Date(Math.max(Date.now(), previousMs + 1)).toISOString();
    const { data: changed, error: updateError } = await supabase.from("_project_files")
      .update({ content: nextContent, updated_at: updatedAt })
      .eq("project_id", projectId).eq("file_path", normalized)
      .eq("updated_at", previousTimestamp)
      .select("file_path");
    if (updateError) throw new Error(updateError.message);
    if (Array.isArray(changed) && changed.length === 1) return nextContent;
  }
  throw new Error("WORK_ITEM_CONFLICT");
}

function mapProjectRow(row: ProjectRow): ProjectMetadata {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishEnabled: row.publish_enabled ?? false,
    customDomain: row.custom_domain,
    lastPublishId: row.last_publish_id,
    tool: row.tool ?? undefined,
  };
}

async function getClient() {
  // The browser editor sends its verified Supabase session as a Bearer token.
  // When a reverse proxy omits SSR cookies, keep project queries bound to that
  // SAME user's JWT so Supabase RLS (auth.uid()) still applies.
  let authorization: string | null = null;
  try {
    authorization = (await headers()).get("authorization");
  } catch {
    // Scripts and jobs without an HTTP request still use the existing SSR client.
  }
  const token = authorization && /^Bearer\s+(\S+)$/i.exec(authorization.trim())?.[1];
  if (token) {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
    const publicKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY || "").trim();
    if (!url || !publicKey) throw new Error("Project authentication is not configured");
    // A per-request public-key client: never put a customer's JWT on the
    // process-wide service-role client, and never bypass project RLS.
    return createBearerClient(url, publicKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return createSupabaseServerClient();
}

async function readMetadata(projectId: string): Promise<ProjectMetadata> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_projects")
    .select("id,owner_id,name,tool,publish_enabled,custom_domain,last_publish_id,created_at,updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Project metadata missing");
  return mapProjectRow(data as ProjectRow);
}

async function writeMetadata(meta: ProjectMetadata): Promise<void> {
  const supabase = await getClient();
  const { error } = await supabase
    .from("_projects")
    .upsert({
      id: meta.id,
      owner_id: meta.ownerId,
      name: meta.name,
      tool: meta.tool ?? null,
      publish_enabled: meta.publishEnabled ?? false,
      custom_domain: meta.customDomain ?? null,
      last_publish_id: meta.lastPublishId ?? null,
      created_at: meta.createdAt,
      updated_at: meta.updatedAt,
    }, { onConflict: "id" });

  if (error) throw new Error(error.message);
}

export async function listProjects(ownerId: string): Promise<ProjectMetadata[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_projects")
    .select("id,owner_id,name,tool,publish_enabled,custom_domain,last_publish_id,created_at,updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProjectRow(row as ProjectRow));
}

export async function createProject(ownerId: string, name: string, tool?: string): Promise<ProjectMetadata> {
  const now = new Date().toISOString();
  const meta: ProjectMetadata = {
    id: randomUUID(),
    ownerId,
    name,
    tool,
    createdAt: now,
    updatedAt: now,
    publishEnabled: false,
    customDomain: null,
    lastPublishId: null,
  };
  await writeMetadata(meta);
  return meta;
}

export async function ensureDefaultProject(ownerId: string, name = "Wonder Build Default") {
  // Do not report an invented project when the real database is unavailable.
  // Callers must handle the storage failure before generating project-linked AI data.
  const existing = await listProjects(ownerId);
  if (existing.length > 0) return existing[0];
  return createProject(ownerId, name);
}

async function assertOwner(projectId: string, ownerId: string) {
  const meta = await readMetadata(projectId);
  if (meta.ownerId !== ownerId) throw new Error("Forbidden");
  return meta;
}

export async function getProjectMetadata(projectId: string, ownerId: string) {
  return assertOwner(projectId, ownerId);
}

export async function updateProjectMetadata(projectId: string, ownerId: string, patch: Partial<ProjectMetadata>) {
  const meta = await assertOwner(projectId, ownerId);
  const updated: ProjectMetadata = { ...meta, ...patch, id: meta.id, ownerId: meta.ownerId, updatedAt: new Date().toISOString() };
  await writeMetadata(updated);
  return updated;
}

export async function listFiles(projectId: string, ownerId: string): Promise<string[]> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_project_files")
    .select("file_path")
    .eq("project_id", projectId)
    .order("file_path", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.file_path as string);
}

export async function readFile(projectId: string, ownerId: string, filePath: string): Promise<string | null> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_project_files")
    .select("content")
    .eq("project_id", projectId)
    .eq("file_path", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.content as string | undefined) ?? null;
}

export async function writeFile(projectId: string, ownerId: string, filePath: string, content: string): Promise<void> {
  const meta = await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  const now = new Date().toISOString();
  const supabase = await getClient();
  const { error } = await supabase
    .from("_project_files")
    .upsert({ project_id: projectId, file_path: normalized, content, updated_at: now }, { onConflict: "project_id,file_path" });

  if (error) throw new Error(error.message);
  meta.updatedAt = now;
  await writeMetadata(meta);
}

export async function writeFiles(projectId: string, ownerId: string, entries: FileEntry[]): Promise<void> {
  await assertOwner(projectId, ownerId);
  if (!entries.length) return;
  const now = new Date().toISOString();
  const rows = entries.map((entry) => {
    const normalized = normalizeFilePath(entry.path);
    if (isReservedWonderSpacePath(normalized)) throw new Error("Invalid project file path");
    return {
      project_id: projectId, file_path: normalized,
      content: entry.content ?? "", updated_at: now,
    };
  });
  const supabase = await getClient();
  const { error } = await supabase.from("_project_files").upsert(rows, { onConflict: "project_id,file_path" });
  if (error) throw new Error(error.message);
  await updateProjectMetadata(projectId, ownerId, { updatedAt: now });
}

export async function deleteFile(projectId: string, ownerId: string, filePath: string): Promise<void> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  const supabase = await getClient();
  const { error } = await supabase
    .from("_project_files")
    .delete()
    .eq("project_id", projectId)
    .eq("file_path", normalized);
  if (error) throw new Error(error.message);
}

export async function deletePath(projectId: string, ownerId: string, targetPath: string): Promise<number> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(targetPath);
  if (isReservedWonderSpacePath(normalized)) throw new Error("Invalid project file path");
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_project_files")
    .select("file_path")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  const matches = (data ?? []).map((row) => row.file_path as string).filter((filePath) => filePath === normalized || filePath.startsWith(`${normalized}/`));
  if (!matches.length) return 0;

  const { error: deleteError } = await supabase
    .from("_project_files")
    .delete()
    .eq("project_id", projectId)
    .in("file_path", matches);
  if (deleteError) throw new Error(deleteError.message);
  return matches.length;
}

// The database RPC performs ownership checks, collision detection and the
// move in one transaction. Never reintroduce copy-then-delete for renames.
export async function renamePath(projectId: string, ownerId: string, oldPath: string, newPath: string): Promise<number> {
  await assertOwner(projectId, ownerId);
  if (typeof oldPath !== "string" || typeof newPath !== "string" ||
      !validRenameInput(oldPath) || !validRenameInput(newPath)) {
    throw new Error("Invalid project file path");
  }
  const oldNormalized = normalizeFilePath(oldPath);
  const newNormalized = normalizeFilePath(newPath);
  if (isReservedWonderSpacePath(oldNormalized) || isReservedWonderSpacePath(newNormalized)) {
    throw new Error("Invalid project file path");
  }
  const supabase = await getClient();
  const { data, error } = await supabase.rpc("rename_builder_project_path", {
    p_project_id: projectId,
    p_old_path: oldNormalized,
    p_new_path: newNormalized,
  });
  if (error) throw new Error(error.message);
  if (typeof data !== "number" || !Number.isSafeInteger(data) || data < 1) {
    throw new Error("Project rename did not complete");
  }
  return data;
}

function validRenameInput(value: string): boolean {
  return value.length >= 1 && value.length <= 512 && !value.startsWith("/") &&
    !/[\\\x00-\x1f\x7f]/.test(value) &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

export async function renameFile(projectId: string, ownerId: string, oldPath: string, newPath: string): Promise<void> {
  // A folder must never move and THEN throw from this single-file API.
  if (typeof oldPath !== "string" || !validRenameInput(oldPath) ||
      (await readFile(projectId, ownerId, oldPath)) === null) {
    throw new Error("Project rename source missing or is a folder");
  }
  const moved = await renamePath(projectId, ownerId, oldPath, newPath);
  if (moved !== 1) throw new Error("Project file changed during rename");
}

export async function moveFile(projectId: string, ownerId: string, oldPath: string, newDir: string): Promise<void> {
  const oldNormalized = normalizeFilePath(oldPath);
  const fileName = oldNormalized.split("/").pop() || "";
  const newNormalized = normalizeFilePath(`${newDir}/${fileName}`);
  await renameFile(projectId, ownerId, oldNormalized, newNormalized);
}

export async function deleteProject(projectId: string, ownerId: string, confirmationName: string): Promise<void> {
  const project = await assertOwner(projectId, ownerId);
  if (confirmationName !== project.name) throw new Error("Project name changed during deletion.");
  const supabase = await getClient();
  // Name check in the query prevents a concurrent rename from bypassing confirmation.
  const { data, error } = await supabase.from("_projects")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .eq("name", confirmationName)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Project name changed during deletion.");
}

export async function createRevision(
  projectId: string,
  ownerId: string,
  snapshot: unknown,
  opts: { label?: string; limit?: number } = {},
): Promise<Revision> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data: latest, error: latestError } = await supabase
    .from("_project_revisions")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw new Error(latestError.message);

  const versionNumber = Number(latest?.version_number ?? 0) + 1;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const { error } = await supabase.from("_project_revisions").insert({
    id,
    project_id: projectId,
    owner_id: ownerId,
    version_number: versionNumber,
    snapshot,
    label: opts.label ?? null,
    created_at: createdAt,
  });
  if (error) throw new Error(error.message);

  const { error: pruneError } = await supabase.rpc("prune_revisions", {
    p_owner_id: ownerId,
    p_project_id: projectId,
    p_limit: opts.limit ?? 50,
  });
  if (pruneError) throw new Error(pruneError.message);

  await updateProjectMetadata(projectId, ownerId, { updatedAt: createdAt });
  return { id, versionNumber, snapshot, createdAt };
}

export async function listRevisions(projectId: string, ownerId: string): Promise<Revision[]> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_project_revisions")
    .select("id,version_number,snapshot,created_at")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    versionNumber: Number(row.version_number),
    snapshot: row.snapshot,
    createdAt: row.created_at as string,
  }));
}

export async function restoreRevision(projectId: string, ownerId: string, revisionId: string): Promise<Revision> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_project_revisions")
    .select("id,version_number,snapshot,created_at")
    .eq("project_id", projectId)
    .eq("id", revisionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Revision not found");

  return {
    id: data.id as string,
    versionNumber: Number(data.version_number),
    snapshot: data.snapshot,
    createdAt: data.created_at as string,
  };
}

export async function createSnapshot(projectId: string, ownerId: string): Promise<Revision> {
  return createRevision(projectId, ownerId, await listFiles(projectId, ownerId));
}

/**
 * Independent, owner-scoped WonderSpace source checkpoints. Unlike builder
 * revisions, these cannot be pruned by visual-editor undo history. Capturing
 * a version is a single authenticated Postgres transaction; file editing
 * remains in _project_files. Checkpoints are not Git repositories.
 */
export type SourceVersionSummary = {
  id: string;
  title: string;
  versionNumber: number;
  createdAt: string;
};

export type SourceVersion = SourceVersionSummary & {
  files: Record<string, string>;
};

export async function listSourceVersions(projectId: string, ownerId: string): Promise<SourceVersionSummary[]> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase.from("_project_source_versions")
    .select("id,title,version_number,created_at")
    .eq("project_id", projectId).eq("owner_id", ownerId)
    .order("version_number", { ascending: false }).limit(50);
  if (error) throw new Error("SOURCE_HISTORY_UNAVAILABLE");
  return (data ?? []).map(row => ({
    id: String(row.id),
    title: String(row.title),
    versionNumber: Number(row.version_number),
    createdAt: String(row.created_at),
  }));
}

export async function captureSourceVersion(
  projectId: string, ownerId: string, title: string,
): Promise<SourceVersionSummary & { fileCount: number }> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  // This RPC uses auth.uid() and RLS; do not invoke it with service-role keys.
  const { data, error } = await supabase.rpc("capture_project_source_version", {
    p_project_id: projectId, p_title: title,
  });
  if (error) {
    const message = String(error.message ?? "");
    if (/SOURCE_HISTORY_LIMIT/.test(message)) throw new Error("SOURCE_HISTORY_LIMIT");
    if (/SOURCE_CHECKPOINT_TOO_LARGE/.test(message)) throw new Error("SOURCE_CHECKPOINT_TOO_LARGE");
    if (/SOURCE_INVALID_TITLE/.test(message)) throw new Error("SOURCE_INVALID_TITLE");
    if (/SOURCE_PROJECT_NOT_FOUND/.test(message)) throw new Error("Forbidden");
    throw new Error("SOURCE_HISTORY_UNAVAILABLE");
  }
  if (!data || typeof data !== "object" || typeof data.id !== "string") {
    throw new Error("SOURCE_HISTORY_UNAVAILABLE");
  }
  return {
    id: data.id,
    title: String(data.title),
    versionNumber: Number(data.versionNumber),
    createdAt: String(data.createdAt),
    fileCount: Number(data.fileCount),
  };
}

export async function loadSourceVersion(
  projectId: string, ownerId: string, versionId: string,
): Promise<SourceVersion> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase.from("_project_source_versions")
    .select("id,title,version_number,created_at,snapshot")
    .eq("project_id", projectId).eq("owner_id", ownerId)
    .eq("id", versionId).maybeSingle();
  if (error) throw new Error("SOURCE_HISTORY_UNAVAILABLE");
  if (!data) throw new Error("SOURCE_VERSION_NOT_FOUND");
  if (!data.snapshot || typeof data.snapshot !== "object" ||
      Array.isArray(data.snapshot)) throw new Error("SOURCE_HISTORY_UNAVAILABLE");

  // RLS protects owner identity; additionally validate every stored path
  // before using it in ZIP exports or a diff. Never serve internal metadata.
  const files: Record<string, string> = {};
  for (const [filePath, content] of Object.entries(data.snapshot as Record<string, unknown>)) {
    if (!validRenameInput(filePath) || isReservedWonderSpacePath(filePath) ||
        typeof content !== "string") throw new Error("SOURCE_HISTORY_UNAVAILABLE");
    files[filePath] = content;
  }
  return {
    id: String(data.id), title: String(data.title),
    versionNumber: Number(data.version_number),
    createdAt: String(data.created_at), files,
  };
}

/** One consistent owner-scoped SELECT for source comparisons, not N file requests. */
export async function readCurrentProjectSourceFiles(
  projectId: string, ownerId: string,
): Promise<Record<string, string>> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { data, error } = await supabase.from("_project_files")
    .select("file_path,content").eq("project_id", projectId)
    .neq("file_path", ".wonderspace")
    .not("file_path", "like", ".wonderspace/%")
    .order("file_path", { ascending: true }).limit(201);
  if (error) throw new Error("SOURCE_HISTORY_UNAVAILABLE");
  if ((data ?? []).length > 200) throw new Error("SOURCE_COMPARE_TOO_LARGE");
  const files: Record<string, string> = {};
  for (const row of data ?? []) {
    const filePath = String(row.file_path);
    if (!validRenameInput(filePath) || isReservedWonderSpacePath(filePath)) {
      throw new Error("SOURCE_HISTORY_UNAVAILABLE");
    }
    files[filePath] = String(row.content ?? "");
  }
  return files;
}
