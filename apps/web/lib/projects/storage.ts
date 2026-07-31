import "server-only";
import path from "path";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";

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

export type Snapshot = {
  id: string;
  createdAt: string;
  files: string[];
};

// Ensure the projects tables exist
async function ensureTables() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS _projects (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tool TEXT,
      publish_enabled BOOLEAN DEFAULT false,
      custom_domain TEXT,
      last_publish_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {});
  await db.query(`
    CREATE TABLE IF NOT EXISTS _project_files (
      project_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      content TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (project_id, file_path)
    )
  `).catch(() => {});
}

function normalizeFilePath(filePath: string) {
  const normalized = path.posix.normalize(filePath).replace(/^\/+/, "");
  if (normalized.startsWith("..")) throw new Error("Invalid path");
  return normalized;
}

async function readMetadata(projectId: string): Promise<ProjectMetadata> {
  await ensureTables();
  const db = getDb();
  const result = await db.query(`SELECT * FROM _projects WHERE id = $1`, [projectId]);
  if (!result.rows[0]) throw new Error("Project metadata missing");
  const r = result.rows[0];
  return {
    id: r.id, ownerId: r.owner_id, name: r.name,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
    publishEnabled: r.publish_enabled, customDomain: r.custom_domain,
    lastPublishId: r.last_publish_id, tool: r.tool,
  };
}

async function writeMetadata(meta: ProjectMetadata): Promise<void> {
  await ensureTables();
  const db = getDb();
  await db.query(`
    INSERT INTO _projects (id, owner_id, name, tool, publish_enabled, custom_domain, last_publish_id, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, tool=EXCLUDED.tool, publish_enabled=EXCLUDED.publish_enabled,
      custom_domain=EXCLUDED.custom_domain, last_publish_id=EXCLUDED.last_publish_id,
      updated_at=EXCLUDED.updated_at
  `, [meta.id, meta.ownerId, meta.name, meta.tool ?? null, meta.publishEnabled ?? false,
      meta.customDomain ?? null, meta.lastPublishId ?? null,
      meta.createdAt, meta.updatedAt]);
}

export async function listProjects(ownerId: string): Promise<ProjectMetadata[]> {
  await ensureTables();
  const db = getDb();
  const result = await db.query(`SELECT * FROM _projects WHERE owner_id = $1 ORDER BY updated_at DESC`, [ownerId]);
  return result.rows.map((r: any) => ({
    id: r.id, ownerId: r.owner_id, name: r.name,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
    publishEnabled: r.publish_enabled, customDomain: r.custom_domain,
    lastPublishId: r.last_publish_id, tool: r.tool,
  }));
}

export async function createProject(ownerId: string, name: string, tool?: string): Promise<ProjectMetadata> {
  const now = new Date().toISOString();
  const meta: ProjectMetadata = {
    id: randomUUID(), ownerId, name, tool,
    createdAt: now, updatedAt: now,
    publishEnabled: false, customDomain: null, lastPublishId: null,
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
    return { id: `project-${ownerId}`, ownerId, name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
  const updated: ProjectMetadata = { ...meta, ...patch, updatedAt: new Date().toISOString() };
  await writeMetadata(updated);
  return updated;
}

export async function listFiles(projectId: string, ownerId: string): Promise<string[]> {
  await assertOwner(projectId, ownerId);
  await ensureTables();
  const db = getDb();
  const result = await db.query(`SELECT file_path FROM _project_files WHERE project_id = $1`, [projectId]);
  return result.rows.map((r: any) => r.file_path);
}

export async function readFile(projectId: string, ownerId: string, filePath: string): Promise<string | null> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  await ensureTables();
  const db = getDb();
  const result = await db.query(`SELECT content FROM _project_files WHERE project_id=$1 AND file_path=$2`, [projectId, normalized]);
  return result.rows[0]?.content ?? null;
}

export async function writeFile(projectId: string, ownerId: string, filePath: string, content: string): Promise<void> {
  const meta = await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  await ensureTables();
  const db = getDb();
  await db.query(`
    INSERT INTO _project_files (project_id, file_path, content, updated_at)
    VALUES ($1,$2,$3,NOW())
    ON CONFLICT (project_id, file_path) DO UPDATE SET content=EXCLUDED.content, updated_at=NOW()
  `, [projectId, normalized, content]);
  meta.updatedAt = new Date().toISOString();
  await writeMetadata(meta);
}

export async function writeFiles(projectId: string, ownerId: string, entries: FileEntry[]): Promise<void> {
  for (const entry of entries) {
    await writeFile(projectId, ownerId, entry.path, entry.content ?? "");
  }
}

export async function deleteFile(projectId: string, ownerId: string, filePath: string): Promise<void> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  await ensureTables();
  const db = getDb();
  await db.query(`DELETE FROM _project_files WHERE project_id=$1 AND file_path=$2`, [projectId, normalized]);
}

export async function deletePath(projectId: string, ownerId: string, path: string): Promise<number> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(path);
  await ensureTables();
  const db = getDb();
  const result = await db.query(
    `DELETE FROM _project_files
     WHERE project_id=$1 AND (file_path=$2 OR file_path LIKE $3)`,
    [projectId, normalized, `${normalized}/%`]
  );
  return result.rowCount ?? 0;
}

export async function renamePath(projectId: string, ownerId: string, oldPath: string, newPath: string): Promise<number> {
  await assertOwner(projectId, ownerId);
  const oldNormalized = normalizeFilePath(oldPath);
  const newNormalized = normalizeFilePath(newPath);
  await ensureTables();
  const db = getDb();

  const result = await db.query(
    `SELECT file_path, content FROM _project_files
     WHERE project_id=$1 AND (file_path=$2 OR file_path LIKE $3)`,
    [projectId, oldNormalized, `${oldNormalized}/%`]
  );

  for (const row of result.rows as Array<{ file_path: string; content: string }>) {
    const relative = row.file_path.slice(oldNormalized.length);
    const dest = `${newNormalized}${relative}`;
    await db.query(
      `INSERT INTO _project_files (project_id, file_path, content, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (project_id, file_path) DO UPDATE SET content=EXCLUDED.content, updated_at=NOW()`,
      [projectId, dest, row.content]
    );
    await db.query(
      `DELETE FROM _project_files WHERE project_id=$1 AND file_path=$2`,
      [projectId, row.file_path]
    );
  }

  return result.rowCount ?? 0;
}

export async function renameFile(projectId: string, ownerId: string, oldPath: string, newPath: string): Promise<void> {
  await assertOwner(projectId, ownerId);
  const oldNormalized = normalizeFilePath(oldPath);
  const newNormalized = normalizeFilePath(newPath);
  await ensureTables();
  const db = getDb();

  const result = await db.query(
    `SELECT content FROM _project_files WHERE project_id=$1 AND file_path=$2`,
    [projectId, oldNormalized]
  );
  const content = result.rows[0]?.content ?? '';

  await db.query(`DELETE FROM _project_files WHERE project_id=$1 AND file_path=$2`, [projectId, oldNormalized]);
  await db.query(`
    INSERT INTO _project_files (project_id, file_path, content, updated_at)
    VALUES ($1,$2,$3,NOW())
    ON CONFLICT (project_id, file_path) DO UPDATE SET content=EXCLUDED.content, updated_at=NOW()
  `, [projectId, newNormalized, content]);
}

export async function moveFile(projectId: string, ownerId: string, oldPath: string, newDir: string): Promise<void> {
  const oldNormalized = normalizeFilePath(oldPath);
  const fileName = oldNormalized.split('/').pop() || '';
  const newNormalized = normalizeFilePath(`${newDir}/${fileName}`);
  await renameFile(projectId, ownerId, oldNormalized, newNormalized);
}

export async function deleteProject(projectId: string, ownerId: string): Promise<void> {
  await assertOwner(projectId, ownerId);
  const db = getDb();
  await db.query(`DELETE FROM _project_files WHERE project_id=$1`, [projectId]);
  await db.query(`DELETE FROM _projects WHERE id=$1`, [projectId]);
}

export async function createSnapshot(projectId: string, ownerId: string): Promise<Snapshot> {
  const files = await listFiles(projectId, ownerId);
  return { id: randomUUID(), createdAt: new Date().toISOString(), files };
}

export async function listSnapshots(projectId: string, ownerId: string): Promise<Snapshot[]> {
  return [];
}

export async function restoreSnapshot(projectId: string, ownerId: string, snapshotId: string): Promise<Snapshot> {
  const snapshots = await listSnapshots(projectId, ownerId);
  const snapshot = snapshots.find((entry) => entry.id === snapshotId);
  if (!snapshot) throw new Error("Snapshot not found");
  return snapshot;
}

// Legacy storage shim for compatibility
export const storage = {
  upload: async (path: string, file: any) => ({ error: null }),
  download: async (path: string) => ({ data: null, error: { message: "Storage not available" } }),
  remove: async (path: string) => ({ error: null }),
  list: async (path: string) => ({ data: [], error: null }),
};
