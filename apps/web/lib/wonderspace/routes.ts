const PROJECT_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export const WONDERSPACE_CODE_HOME = "/dashboard?workspaceTab=code#projects";

export function normalizeWonderSpaceProjectId(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const projectId = raw.trim();
  return PROJECT_ID_RE.test(projectId) ? projectId : null;
}

export function wonderSpaceProjectHub(projectId: string): string {
  return `/dashboard/projects/${encodeURIComponent(projectId)}`;
}

export function wonderSpaceProjectFiles(projectId: string): string {
  return `${wonderSpaceProjectHub(projectId)}/files`;
}

export function wonderSpaceProjectIde(projectId: string): string {
  return `${wonderSpaceProjectHub(projectId)}/ide`;
}
