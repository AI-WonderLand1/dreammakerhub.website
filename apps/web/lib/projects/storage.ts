import "server-only";
import path from "path";
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
  try {
    const existing = await listProjects(ownerId);
    if (existing.length > 0) return existing[0];
    return createProject(ownerId, name);
  } catch {
    return {
      id: `project-${ownerId}`,
      ownerId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
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
  const rows = entries.map((entry) => ({
    project_id: projectId,
    file_path: normalizeFilePath(entry.path),
    content: entry.content ?? "",
    updated_at: now,
  }));
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

export async function renamePath(projectId: string, ownerId: string, oldPath: string, newPath: string): Promise<number> {
  await assertOwner(projectId, ownerId);
  const oldNormalized = normalizeFilePath(oldPath);
  const newNormalized = normalizeFilePath(newPath);
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("_project_files")
    .select("file_path,content")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  const matches = (data ?? []).filter((row) => {
    const filePath = row.file_path as string;
    return filePath === oldNormalized || filePath.startsWith(`${oldNormalized}/`);
  });
  if (!matches.length) return 0;

  const now = new Date().toISOString();
  const replacements = matches.map((row) => {
    const filePath = row.file_path as string;
    return {
      project_id: projectId,
      file_path: `${newNormalized}${filePath.slice(oldNormalized.length)}`,
      content: (row.content as string | null) ?? "",
      updated_at: now,
    };
  });

  const { error: upsertError } = await supabase.from("_project_files").upsert(replacements, { onConflict: "project_id,file_path" });
  if (upsertError) throw new Error(upsertError.message);

  const oldFiles = matches.map((row) => row.file_path as string);
  const { error: deleteError } = await supabase.from("_project_files").delete().eq("project_id", projectId).in("file_path", oldFiles);
  if (deleteError) throw new Error(deleteError.message);
  await updateProjectMetadata(projectId, ownerId, { updatedAt: now });
  return matches.length;
}

export async function renameFile(projectId: string, ownerId: string, oldPath: string, newPath: string): Promise<void> {
  await assertOwner(projectId, ownerId);
  const oldNormalized = normalizeFilePath(oldPath);
  const newNormalized = normalizeFilePath(newPath);
  const content = (await readFile(projectId, ownerId, oldNormalized)) ?? "";
  await writeFile(projectId, ownerId, newNormalized, content);
  await deleteFile(projectId, ownerId, oldNormalized);
}

export async function moveFile(projectId: string, ownerId: string, oldPath: string, newDir: string): Promise<void> {
  const oldNormalized = normalizeFilePath(oldPath);
  const fileName = oldNormalized.split("/").pop() || "";
  const newNormalized = normalizeFilePath(`${newDir}/${fileName}`);
  await renameFile(projectId, ownerId, oldNormalized, newNormalized);
}

export async function deleteProject(projectId: string, ownerId: string): Promise<void> {
  await assertOwner(projectId, ownerId);
  const supabase = await getClient();
  const { error } = await supabase.from("_projects").delete().eq("id", projectId).eq("owner_id", ownerId);
  if (error) throw new Error(error.message);
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
