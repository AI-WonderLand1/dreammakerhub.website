import "server-only";
import { randomUUID } from "node:crypto";
import { listInternalProjectFilesByPrefix, updateProjectFileAtomically, writeFile } from "@/lib/projects/storage";

export type WorkItemKind = "issue" | "discussion";
export type WorkItemStatus = "open" | "closed";
export type WorkItemComment = { id: string; body: string; authorId: string; createdAt: string };
export type ProjectWorkItem = {
  id: string;
  kind: WorkItemKind;
  title: string;
  body: string;
  status: WorkItemStatus;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  comments: WorkItemComment[];
};

const MAX_ITEMS = 250;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const prefixFor = (kind: WorkItemKind) => `.wonderspace/work-items/${kind}/`;
const itemPath = (kind: WorkItemKind, id: string) => `${prefixFor(kind)}${id}.json`;

export function isWorkItemKind(value: unknown): value is WorkItemKind {
  return value === "issue" || value === "discussion";
}

export function validateItemText(title: unknown, body: unknown) {
  if (typeof title !== "string" || !title.trim() || title.trim().length > 140 ||
      typeof body !== "string" || body.length > 10000) return null;
  return { title: title.trim(), body };
}

function parseItem(value: string | null, kind: WorkItemKind): ProjectWorkItem | null {
  if (!value) return null;
  try {
    const item: ProjectWorkItem = JSON.parse(value);
    if (!ID_PATTERN.test(item.id) || item.kind !== kind ||
        typeof item.title !== "string" || typeof item.body !== "string" ||
        !["open", "closed"].includes(item.status) || !Array.isArray(item.comments)) return null;
    return item;
  } catch {
    return null;
  }
}

export async function listWorkItems(projectId: string, ownerId: string, kind: WorkItemKind) {
  // Read only native rows in one owner-scoped query, not N individual Supabase requests.
  const rows = await listInternalProjectFilesByPrefix(projectId, ownerId, prefixFor(kind), MAX_ITEMS + 1);
  if (rows.length > MAX_ITEMS) throw new Error("WORK_ITEM_LIMIT_REACHED");
  return rows
    .filter(row => row.path.endsWith(".json") &&
      ID_PATTERN.test(row.path.slice(prefixFor(kind).length).replace(/\\.json$/, "")))
    .map(row => parseItem(row.content, kind))
    .filter((item): item is ProjectWorkItem => item !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createWorkItem(
  projectId: string, ownerId: string, kind: WorkItemKind, text: { title: string; body: string },
) {
  const rows = await listInternalProjectFilesByPrefix(projectId, ownerId, prefixFor(kind), MAX_ITEMS + 1);
  if (rows.length >= MAX_ITEMS) throw new Error("WORK_ITEM_LIMIT_REACHED");
  const createdAt = new Date().toISOString();
  const item: ProjectWorkItem = {
    id: randomUUID(), kind, title: text.title, body: text.body, status: "open",
    authorId: ownerId, createdAt, updatedAt: createdAt, comments: [],
  };
  await writeFile(projectId, ownerId, itemPath(kind, item.id), JSON.stringify(item));
  return item;
}

export async function updateWorkItem(
  projectId: string, ownerId: string, kind: WorkItemKind, id: string,
  change: { status?: WorkItemStatus; title?: string; body?: string; comment?: string },
) {
  if (!ID_PATTERN.test(id)) throw new Error("INVALID_ITEM_ID");
  const path = itemPath(kind, id);
  const updated = await updateProjectFileAtomically(projectId, ownerId, path, previous => {
    // Each CAS retry applies this change to the *latest* committed content.
    const item = parseItem(previous, kind);
    if (!item || item.id !== id) throw new Error("ITEM_NOT_FOUND");
    if (change.title !== undefined || change.body !== undefined) {
      const text = validateItemText(change.title ?? item.title, change.body ?? item.body);
      if (!text) throw new Error("INVALID_ITEM_TEXT");
      item.title = text.title;
      item.body = text.body;
    }
    if (change.status !== undefined) {
      if (change.status !== "open" && change.status !== "closed") throw new Error("INVALID_ITEM_STATUS");
      item.status = change.status;
    }
    if (change.comment !== undefined) {
      if (typeof change.comment !== "string" || !change.comment.trim() ||
          change.comment.length > 3000 || item.comments.length >= 100) throw new Error("INVALID_COMMENT");
      item.comments.push({
        id: randomUUID(), body: change.comment.trim(), authorId: ownerId,
        createdAt: new Date().toISOString(),
      });
    }
    item.updatedAt = new Date().toISOString();
    return JSON.stringify(item);
  });
  // The returned JSON is the exact winning compare-and-swap write.
  return JSON.parse(updated) as ProjectWorkItem;
}
