import type { LayoutNode } from "../../app/(builder)/wonder-build/builder/engine/LayoutTree";

type WonderProjectKind = "wonder-build" | "workspace";

export type WonderProject = {
  id: string;
  name: string;
  kind?: WonderProjectKind;
  createdAt: string;
  updatedAt: string;
  [k: string]: any;
};

// Backward-compatible alias consumed by dashboard pages.
export type Project = WonderProject;

export type WonderBuildState<TState = unknown> = {
  version: number;
  updatedAt: string;
  root?: LayoutNode;
  state: TState;
};

const PROJECTS_STORAGE_KEY = "wonder-build-projects";

const inMemoryProjects = new Map<string, WonderProject>();

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = "project") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStoredProjects(): WonderProject[] {
  if (typeof window === "undefined") {
    return Array.from(inMemoryProjects.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WonderProject[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredProjects(projects: WonderProject[]) {
  if (typeof window === "undefined") {
    inMemoryProjects.clear();
    projects.forEach((project) => inMemoryProjects.set(project.id, project));
    return;
  }

  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage failures to avoid breaking editor usage.
  }
}

export const createProject = async (
  name: string,
  kind: WonderProjectKind = "wonder-build",
): Promise<WonderProject> => {
  const timestamp = nowIso();
  const project: WonderProject = {
    id: randomId("wb"),
    name: name.trim() || "Untitled Project",
    kind,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const existing = readStoredProjects();
  writeStoredProjects([project, ...existing.filter((p) => p.id !== project.id)]);
  return project;
};

export const listProjects = async (): Promise<Project[]> => {
  return readStoredProjects();
};

export const getProjects = async (): Promise<WonderProject[]> => {
  return listProjects();
};

export const getProjectById = async (
  id: string,
): Promise<WonderProject | null> => {
  const project = readStoredProjects().find((entry) => entry.id === id);
  return project ?? null;
};

export const loadWonderBuildState = async <TState = unknown>(
  projectId: string,
): Promise<WonderBuildState<TState> | null> => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`wonder-build-${projectId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveWonderBuildState = async <TState = unknown>(
  projectId: string,
  state: WonderBuildState<TState>,
): Promise<void> => {
  if (typeof window === "undefined") {
    await fetch('/api/wonder-build/state', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId,
        path: '.wonderbuild/state.json',
        state,
      }),
    });
    return;
  }

  try {
    localStorage.setItem(`wonder-build-${projectId}`, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};
