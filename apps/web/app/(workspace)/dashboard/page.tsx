"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProjectDeleteButton from "./components/ProjectDeleteButton";
import WonderSpaceDashboardPanel from "@/components/dashboard/WonderSpaceDashboardPanel";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import {
  Bot,
  Box,
  Clock3,
  Code2,
  Folder,
  Gamepad2,
  Globe2,
  Plus,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  type?: string | null;
  description?: string | null;
  updatedAt?: string;
  updated_at?: string;
};

type ProjectType = "wonderbuild" | "game" | "workspace" | "npc" | "ai";

const normalizedType = (type?: string | null) => (type || "").toLowerCase();

const projectIcon = (type?: string | null) => {
  const value = normalizedType(type);
  if (["game", "3d", "3d_scene", "playcanvas"].includes(value)) return Gamepad2;
  if (["workspace", "code"].includes(value)) return Code2;
  if (value === "npc") return Bot;
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(value)) return Sparkles;
  return Globe2;
};

const projectLabel = (type?: string | null) => {
  const value = normalizedType(type);
  if (["game", "3d", "3d_scene", "playcanvas"].includes(value)) return "3D Experience";
  if (["workspace", "code"].includes(value)) return "Code / Files";
  if (value === "npc") return "NPC AI";
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(value)) return "AI App";
  return "Website";
};

const projectToolAction = (type: string | null | undefined, projectId: string) => {
  const value = normalizedType(type);
  const projectQuery = `projectId=${encodeURIComponent(projectId)}`;
  if (["workspace", "code"].includes(value)) return { label: "Files", href: `/dashboard/projects/${encodeURIComponent(projectId)}/files` };
  if (["game", "3d", "3d_scene", "playcanvas"].includes(value)) return { label: "3D Studio", href: `/dashboard/3dhub?${projectQuery}` };
  if (value === "npc") return { label: "NPC Studio", href: `/wonder-play?${projectQuery}` };
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(value)) return { label: "AI Tools", href: `/dashboard/agents?${projectQuery}` };
  return { label: "WonderBuild", href: `/wonder-build/builder?${projectQuery}` };
};

const relativeDate = (value?: string) => {
  if (!value) return "Recently";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const projectTimestamp = (project: Project) => {
  const raw = project.updatedAt || project.updated_at;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assetCount, setAssetCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [projectLoadError, setProjectLoadError] = useState("");
  const [projectReloadKey, setProjectReloadKey] = useState(0);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<ProjectType>("wonderbuild");
  const [displayName, setDisplayName] = useState("Your");

  useEffect(() => {
    if (searchParams.get("create") === "project") setShowCreate(true);
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setProjectLoadError("Project storage is not configured. Files are unavailable; no project data has been changed.");
      setLoading(false);
      return;
    }

    async function load() {
      setProjectLoadError("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/public-pages/auth?redirectTo=%2Fdashboard");
        return;
      }

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Your";
      setDisplayName(name);

      try {
        const [projectsResponse, assetsResponse] = await Promise.all([
          fetchAuthenticatedProject("/api/projects"),
          fetch("/api/assets/user"),
        ]);

        if (!projectsResponse.ok) {
          const failure = await projectsResponse.json().catch(() => ({}));
          throw new Error(failure?.message || failure?.error || "Could not load your projects. Retry; your existing files have not been changed.");
        }
        const data = await projectsResponse.json().catch(() => ({}));
        if (!Array.isArray(data.projects)) {
          throw new Error("The project service returned an invalid response. Retry rather than creating duplicate projects.");
        }
        setProjects(data.projects);

        if (assetsResponse.ok) {
          const assetData = await assetsResponse.json().catch(() => ({}));
          setAssetCount(Array.isArray(assetData.assets) ? assetData.assets.length : 0);
        }
      } finally {
        setLoading(false);
      }
    }

    load().catch((cause) => {
      setProjectLoadError(cause instanceof Error ? cause.message : "Unable to load your projects. Retry.");
      setLoading(false);
    });
  }, [router, projectReloadKey]);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => projectTimestamp(b) - projectTimestamp(a)),
    [projects],
  );
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const filteredProjects = useMemo(() => {
    if (!query) return sortedProjects;
    return sortedProjects.filter((project) => {
      const type = project.tool || project.type;
      return [project.name, project.description || "", projectLabel(type)]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [query, sortedProjects]);
  const visibleProjects = showAllProjects ? filteredProjects : filteredProjects.slice(0, 6);
  const workspaceName = `${displayName}'s Workspace`;
  const showOverview = !["code", "history", "tools"].includes(searchParams.get("workspaceTab") || "overview");
  const mostRecentProject = sortedProjects[0] || null;
  const lastActive = mostRecentProject
    ? relativeDate(mostRecentProject.updatedAt || mostRecentProject.updated_at)
    : "No activity yet";

  const openCreate = () => {
    setCreateError("");
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateError("");
    setNewProjectName("");
    if (searchParams.get("create") === "project") router.replace("/dashboard#projects");
  };

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name || creating) return;

    setCreating(true);
    setCreateError("");
    try {
      const response = await fetchAuthenticatedProject("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tool: newProjectType, type: newProjectType }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.project?.id) {
        throw new Error(data?.message || "Failed to create project");
      }
      router.push(`/dashboard/projects/${encodeURIComponent(data.project.id)}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const statCards = [
    { icon: Folder, value: String(projects.length), label: "Projects", className: "text-blue-400" },
    { icon: Box, value: assetCount === null ? "—" : String(assetCount), label: "3D Assets", className: "text-amber-400" },
    { icon: Clock3, value: lastActive, label: "Last active", className: "text-cyan-400" },
  ];

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#07101b] text-white">
      <div>
        <div className="min-w-0">
          <header className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">{workspaceName}</h1>
            <p className="mt-1 text-sm text-slate-400">One place for projects, code, saved versions and tools.</p>
          </header>

          <WonderSpaceDashboardPanel
            projects={sortedProjects}
            requestedProjectId={searchParams.get("projectId")}
            onCreate={() => { setNewProjectType("workspace"); openCreate(); }}
          />

          {projectLoadError && (
            <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <span>{projectLoadError}</span>
              <button type="button" onClick={() => { setLoading(true); setProjectReloadKey((key) => key + 1); }} className="rounded-md border border-amber-300/40 px-3 py-1.5 font-semibold hover:bg-amber-400/10">Retry loading projects</button>
            </div>
          )}

          {showOverview && (
            <div className="space-y-5">
          <div id="overview" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ icon: Icon, value, label, className }) => (
              <div key={label} className="flex min-h-24 items-center gap-4 rounded-xl border border-white/10 bg-[#0d1625] p-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5 ${className}`}><Icon size={23} /></div>
                <div className="min-w-0"><b className="block truncate text-xl">{value}</b><span className="text-xs text-white/45">{label}</span></div>
              </div>
            ))}
          </div>

          <section id="projects">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Your Projects</h2>
                <p className="text-sm text-white/45">All project types stay together here. Select one to open its project dashboard and files.</p>
                {query && <p className="mt-1 text-xs text-violet-300">Showing matches for “{searchParams.get("q")}”</p>}
              </div>
              <div className="flex items-center gap-3">
                {query && <Link href="/dashboard#projects" className="text-xs text-white/50 hover:text-white">Clear search</Link>}
                {filteredProjects.length > 6 && (
                  <button type="button" onClick={() => setShowAllProjects((value) => !value)} className="text-xs text-blue-400 hover:underline">
                    {showAllProjects ? "Show recent" : "View all projects →"}
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-xl bg-white/5" />)}</div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-12 text-center">
                <WandSparkles className="mx-auto mb-4 text-violet-400" size={36} />
                <h3 className="font-bold">Create your first project</h3>
                <p className="mt-2 text-sm text-white/45">Create it here, then land directly on its project dashboard.</p>
                <button type="button" onClick={openCreate} className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold">New Project</button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-10 text-center">
                <Folder className="mx-auto mb-3 text-white/30" size={32} />
                <h3 className="font-semibold">No projects match that search</h3>
                <p className="mt-2 text-sm text-white/40">Try a project name, description, or project type.</p>
                <Link href="/dashboard#projects" className="mt-4 inline-block text-sm text-blue-400 hover:underline">Clear search</Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((project) => {
                  const type = project.tool || project.type;
                  const value = normalizedType(type);
                  const Icon = projectIcon(type);
                  const previewable = !["workspace", "code", "npc", "ai", "ai_app", "ai-playground", "ai_playground"].includes(value);
                  const toolAction = projectToolAction(type, project.id);
                  return (
                    <article key={project.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1625] transition hover:-translate-y-0.5 hover:border-violet-500/35">
                      <Link href={`/dashboard/projects/${project.id}`} className="relative block h-40 overflow-hidden border-b border-white/10 bg-[#08111e]">
                        {previewable ? (
                          <iframe
                            src={`/preview/${encodeURIComponent(project.id)}?v=${encodeURIComponent(project.updatedAt || project.updated_at || "")}`}
                            title={`${project.name} preview`}
                            className="h-full w-full border-0 bg-[#08111e] pointer-events-none"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,.25),transparent_35%),linear-gradient(145deg,#10182a,#07111d)]">
                            <div className="text-center"><Icon className="mx-auto text-violet-300" size={40}/><p className="mt-3 text-sm font-semibold text-white/75">{projectLabel(type)}</p></div>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07101b]/65 via-transparent to-transparent" />
                      </Link>
                      <div className="p-4">
                        <div className="flex items-center gap-2"><Icon size={17} className="text-violet-300" /><h3 className="truncate font-bold">{project.name}</h3></div>
                        <span className="mt-2 inline-block rounded-full border border-blue-500/40 px-2 py-0.5 text-[10px] text-blue-300">{projectLabel(type)}</span>
                        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-white/45">{project.description || "No description yet."}</p>
                        <p className="mt-3 text-xs text-white/40">Updated {relativeDate(project.updatedAt || project.updated_at)}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <Link href={["workspace", "code"].includes(value) ? `/dashboard/projects/${encodeURIComponent(project.id)}/files` : `/dashboard/projects/${encodeURIComponent(project.id)}`} className="rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-2 py-2 text-center text-xs font-semibold">{["workspace", "code"].includes(value) ? "Open files" : "Open project"}</Link>
                          <Link href={`/dashboard/projects/${project.id}`} className="rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">Details</Link>
                          <Link href={toolAction.href} className="truncate rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">{toolAction.label}</Link>
                        </div>
              <div className="mt-2 flex justify-end">
                <ProjectDeleteButton
                  project={project}
                  onDeleted={() => setProjects((current) => current.filter((entry) => entry.id !== project.id))}
                  className="inline-flex items-center gap-1 rounded-md border border-red-500/25 px-2 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10"
                  label="Delete"
                />
              </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
            </div>
          )}
        </div>

      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) closeCreate(); }}>
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1626] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold">New Project</h2><p className="mt-1 text-sm text-white/45">Pick the project type here, then land directly on the same project dashboard.</p></div>
              <button type="button" onClick={closeCreate} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"><X size={18} /></button>
            </div>

            <label className="block text-xs font-semibold text-white/60">Project name</label>
            <input
              autoFocus
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void createProject(); }}
              placeholder="My new project"
              className="mt-2 w-full rounded-lg border border-white/15 bg-white/[.035] px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-violet-500"
            />

            <p className="mb-2 mt-5 text-xs font-semibold text-white/60">Project type</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {([
                ["wonderbuild", "Website", Globe2],
                ["workspace", "Code / Files", Code2],
                ["game", "3D / Game", Gamepad2],
                ["npc", "NPC AI", Bot],
                ["ai", "AI App", Sparkles],
              ] as const).map(([value, label, Icon]) => {
                const option = (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNewProjectType(value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm ${newProjectType === value ? "border-violet-500 bg-violet-500/15 text-white" : "border-white/10 text-white/55 hover:bg-white/5"}`}
                >
                  <Icon size={17} /> {label}
                </button>
                );
                return option;
              })}
            </div>

            {createError && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{createError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeCreate} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5">Cancel</button>
              <button type="button" onClick={() => void createProject()} disabled={creating || !newProjectName.trim()} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-bold disabled:opacity-50">
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
