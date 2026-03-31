import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type ProjectPlatform = "web" | "ios" | "android" | "multi";
type IntegrationMode = "link" | "fork" | "new";

type Project = {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  platform: ProjectPlatform;
  files: number;
  workspaceOwner: string;
  playcanvasProjectId: string | null;
  sceneId: string | null;
  integrationMode: IntegrationMode;
  cloudConnectionId: string | null;
};

type IncomingProject = {
  id?: string;
  name?: string;
  description?: string;
  platform?: ProjectPlatform;
  files?: number;
  workspaceOwner?: string;
  playcanvasProjectId?: string | null;
  sceneId?: string | null;
  integrationMode?: IntegrationMode;
  cloudConnectionId?: string | null;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "wonderspace-projects.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROJECTS_FILE);
  } catch {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

function normalizeProject(input: Partial<Project>): Project {
  return {
    id: input.id ?? `project-${Date.now()}`,
    name: input.name ?? "Untitled WonderSpace Project",
    description: input.description ?? "",
    lastModified: input.lastModified ?? new Date().toISOString(),
    platform: input.platform ?? "web",
    files: typeof input.files === "number" ? input.files : 0,
    workspaceOwner: input.workspaceOwner ?? "unassigned",
    playcanvasProjectId: input.playcanvasProjectId ?? null,
    sceneId: input.sceneId ?? null,
    integrationMode: input.integrationMode ?? "new",
    cloudConnectionId: input.cloudConnectionId ?? null,
  };
}

async function readProjects(): Promise<Project[]> {
  await ensureDataFile();
  const raw = await fs.readFile(PROJECTS_FILE, "utf8");
  const parsed = JSON.parse(raw) as Array<Partial<Project>>;
  return parsed.map((project) => normalizeProject(project));
}

async function writeProjects(projects: Project[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
}

function validateProjectPayload(body: IncomingProject): string | null {
  if (!body.name?.trim()) {
    return "Project name is required";
  }
  if (!body.workspaceOwner?.trim()) {
    return "Workspace ownership is required";
  }
  if (body.integrationMode && !["link", "fork", "new"].includes(body.integrationMode)) {
    return "Invalid integration mode";
  }
  if (body.platform && !["web", "ios", "android", "multi"].includes(body.platform)) {
    return "Invalid platform";
  }
  if (body.integrationMode === "link") {
    if (!body.sceneId?.trim()) {
      return "Scene ID is required when linking an existing PlayCanvas project";
    }
    if (!body.playcanvasProjectId?.trim()) {
      return "PlayCanvas project ID is required when linking an existing PlayCanvas project";
    }
  }
  return null;
}

export async function GET() {
  try {
    const projects = await readProjects();
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingProject;
    const validationError = validateProjectPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const projects = await readProjects();
    const project: Project = normalizeProject({
      id: body.id,
      name: body.name?.trim(),
      description: body.description?.trim() ?? "",
      platform: body.platform,
      files: body.files,
      workspaceOwner: body.workspaceOwner?.trim(),
      playcanvasProjectId: body.playcanvasProjectId?.trim() || null,
      sceneId: body.sceneId?.trim() || null,
      integrationMode: body.integrationMode,
      cloudConnectionId: body.cloudConnectionId?.trim() || null,
      lastModified: new Date().toISOString(),
    });

    projects.unshift(project);
    await writeProjects(projects);

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
