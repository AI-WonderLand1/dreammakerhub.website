import "server-only";
import path from "path";
import { randomUUID } from "crypto";
import { SupabaseStorageProvider } from "@infra/services/storage/SupabaseProvider";

export const storage = SupabaseStorageProvider;

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

const PROJECTS_PREFIX = "projects";

const projectPrefix = (projectId: string) => `${PROJECTS_PREFIX}/${projectId}`;
const projectFilesPrefix = (projectId: string) => `${projectPrefix(projectId)}/files/`;
const metadataPath = (projectId: string) => `${projectPrefix(projectId)}/metadata.json`;
const snapshotDir = (projectId: string) => `${projectPrefix(projectId)}/snapshots/`;

function normalizeFilePath(filePath: string) {
  const normalized = path.posix.normalize(filePath).replace(/^\/+/, "");
  if (normalized.startsWith("..")) {
    throw new Error("Invalid path");
  }
  return normalized;
}

async function readMetadata(projectId: string): Promise<ProjectMetadata> {
  const { data, error } = await storage.download(metadataPath(projectId));
  if (error || !data) throw new Error("Project metadata missing");
  const text = await data.text();
  return JSON.parse(text) as ProjectMetadata;
}

async function writeMetadata(meta: ProjectMetadata) {
  await storage.upload(metadataPath(meta.id), Buffer.from(JSON.stringify(meta, null, 2)));
}

export async function listProjects(ownerId: string): Promise<ProjectMetadata[]> {
  const { data, error } = await storage.list(`${PROJECTS_PREFIX}/`);
  if (error || !data) return [];

  const metas = await Promise.all(
    data.map(async (entry) => {
      const name = entry.name;
      const path = name.endsWith("metadata.json")
        ? `${PROJECTS_PREFIX}/${name}`
        : metadataPath(name);
      try {
        const { data: fileData } = await storage.download(path);
        if (!fileData) return null;
        const text = await fileData.text();
        const meta = JSON.parse(text) as ProjectMetadata;
        return meta.ownerId === ownerId ? meta : null;
      } catch {
        return null;
      }
    })
  );

  return metas
    .filter((m): m is ProjectMetadata => Boolean(m))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createProject(
  ownerId: string,
  name: string,
  tool?: string,
): Promise<ProjectMetadata> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const meta: ProjectMetadata = {
    id,
    ownerId,
    name,
    createdAt: now,
    updatedAt: now,
    publishEnabled: false,
    customDomain: null,
    lastPublishId: null,
    tool,
  };

  await writeMetadata(meta);
  return meta;
}

export async function ensureDefaultProject(ownerId: string, name = "Wonder Build Default") {
  const existing = await listProjects(ownerId);
  if (existing.length > 0) return existing[0];
  return createProject(ownerId, name);
}

async function assertOwner(projectId: string, ownerId: string) {
  const meta = await readMetadata(projectId);
  if (meta.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }
  return meta;
}

export async function getProjectMetadata(projectId: string, ownerId: string) {
  return assertOwner(projectId, ownerId);
}

export async function updateProjectMetadata(
  projectId: string,
  ownerId: string,
  patch: Partial<ProjectMetadata>,
) {
  const meta = await assertOwner(projectId, ownerId);
  const updated: ProjectMetadata = { ...meta, ...patch, updatedAt: new Date().toISOString() };
  await writeMetadata(updated);
  return updated;
}

export async function listFiles(projectId: string, ownerId: string): Promise<string[]> {
  await assertOwner(projectId, ownerId);
  const prefix = projectFilesPrefix(projectId);

  const { data, error } = await storage.list(prefix);
  if (error || !data) return [];

  return data.map((file) => file.name.replace(prefix, ""));
}

export async function readFile(projectId: string, ownerId: string, filePath: string): Promise<string | null> {
  await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  const fullPath = `${projectFilesPrefix(projectId)}${normalized}`;

  const { data } = await storage.download(fullPath);
  if (!data) return null;

  return await data.text();
}

export async function writeFile(
  projectId: string,
  ownerId: string,
  filePath: string,
  content: string,
): Promise<void> {
  const meta = await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  const fullPath = `${projectFilesPrefix(projectId)}${normalized}`;

  await storage.upload(fullPath, Buffer.from(content));
  meta.updatedAt = new Date().toISOString();
  await writeMetadata(meta);
}

export async function writeFiles(
  projectId: string,
  ownerId: string,
  entries: FileEntry[],
): Promise<void> {
  for (const entry of entries) {
    await writeFile(projectId, ownerId, entry.path, entry.content ?? "");
  }
}

export async function deleteFile(projectId: string, ownerId: string, filePath: string): Promise<void> {
  const meta = await assertOwner(projectId, ownerId);
  const normalized = normalizeFilePath(filePath);
  const fullPath = `${projectFilesPrefix(projectId)}${normalized}`;

  await storage.remove(fullPath);
  meta.updatedAt = new Date().toISOString();
  await writeMetadata(meta);
}

export async function createSnapshot(projectId: string, ownerId: string): Promise<Snapshot> {
  const meta = await assertOwner(projectId, ownerId);
  const files = await listFiles(projectId, ownerId);
  const snapshotId = randomUUID();
  const createdAt = new Date().toISOString();

  const fileContents: Record<string, string> = {};
  for (const file of files) {
    const content = await readFile(projectId, ownerId, file);
    if (content !== null) {
      fileContents[file] = content;
    }
  }

  const record: Snapshot = { id: snapshotId, createdAt, files };

  await storage.upload(
    `${snapshotDir(projectId)}${snapshotId}.json`,
    Buffer.from(JSON.stringify({ snapshot: record, files: fileContents }, null, 2))
  );

  meta.updatedAt = createdAt;
  await writeMetadata(meta);
  return record;
}

export async function listSnapshots(projectId: string, ownerId: string): Promise<Snapshot[]> {
  await assertOwner(projectId, ownerId);

  const { data, error } = await storage.list(snapshotDir(projectId));
  if (error || !data) return [];

  const snaps = await Promise.all(
    data.map(async (entry) => {
      const fullPath = `${snapshotDir(projectId)}${entry.name}`;
      const { data: fileData } = await storage.download(fullPath);
      if (!fileData) return null;

      try {
        const text = await fileData.text();
        return (JSON.parse(text) as { snapshot: Snapshot }).snapshot;
      } catch {
        return null;
      }
    })
  );

  return snaps
    .filter((snap): snap is Snapshot => Boolean(snap))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function restoreSnapshot(projectId: string, ownerId: string, snapshotId: string): Promise<Snapshot> {
  const meta = await assertOwner(projectId, ownerId);

  const { data } = await storage.download(`${snapshotDir(projectId)}${snapshotId}.json`);
  if (!data) throw new Error("Snapshot not found");

  const text = await data.text();
  const payload = JSON.parse(text) as { snapshot: Snapshot; files: Record<string, string> };

  const entries: FileEntry[] = Object.entries(payload.files).map(([filePath, content]) => ({
    path: filePath,
    content,
  }));

  await writeFiles(projectId, ownerId, entries);

  meta.updatedAt = new Date().toISOString();
  await writeMetadata(meta);

  return payload.snapshot;
}
