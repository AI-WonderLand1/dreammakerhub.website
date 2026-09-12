"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Box,
  ChevronDown,
  Clock3,
  Folder,
  Gamepad2,
  Globe2,
  LayoutTemplate,
  Plus,
  Sparkles,
  UserRound,
  Users,
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

type ProjectType = "wonderbuild" | "game" | "workspace";

const projectIcon = (type?: string | null) => {
  if (["game", "3d_scene", "playcanvas"].includes(type || "")) return Gamepad2;
  if (type === "workspace") return Box;
  return Globe2;
};

const projectLabel = (type?: string | null) => {
  if (["game", "3d_scene", "playcanvas"].includes(type || "")) return "3D Experience";
  if (type === "workspace") return "IDE Project";
  return "Website";
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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<ProjectType>("wonderbuild");
  const [displayName, setDisplayName] = useState("Your");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (searchParams.get("create") === "project") setShowCreate(true);
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function load() {
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
      setEmail(user.email || "");

      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(Array.isArray(data.projects) ? data.projects : []);
        }
      } finally {
        setLoading(false);
      }
    }

    load().catch(() => setLoading(false));
  }, [router]);

  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const visibleProjects = showAllProjects ? projects : projects.slice(0, 6);
  const workspaceName = `${displayName}'s Workspace`;

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
      const response = await fetch("/api/projects", {
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
    { icon: Users, value: "1", label: "Member", className: "text-emerald-400" },
    { icon: Box, value: "—", label: "3D Assets", className: "text-amber-400" },
    { icon: Clock3, value: "Today", label: "Last active", className: "text-cyan-400" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080e19] text-white">
      <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
        <main className="min-w-0">
          <div className="relative mb-5 flex flex-wrap items-center gap-2 text-sm text-white/65">
            <button
              type="button"
              onClick={() => setWorkspaceOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
              {workspaceName}
              <ChevronDown size={14} />
            </button>
            <span className="text-white/25">/</span>
            <button
              type="button"
              onClick={() => setProjectOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-white/90 hover:bg-white/10"
            >
              Select project <ChevronDown size={14} />
            </button>

            {workspaceOpen && (
              <div className="absolute left-0 top-11 z-30 w-80 rounded-xl border border-white/15 bg-[#0c1524] p-3 shadow-2xl">
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Personal</p>
                <button type="button" onClick={() => setWorkspaceOpen(false)} className="flex w-full items-center gap-3 rounded-lg bg-violet-500/15 p-3 text-left">
                  <UserRound size={18} className="text-violet-300" />
                  <span><b className="block text-sm">{workspaceName}</b><span className="text-xs text-white/45">Personal workspace</span></span>
                </button>
                <div className="my-3 border-t border-white/10" />
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Organization (optional)</p>
                <p className="px-2 py-2 text-xs leading-5 text-white/45">Organization workspaces are managed from Team.</p>
                <Link href="/dashboard/collaboration" className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/5">
                  <Plus size={14} /> Manage organizations
                </Link>
              </div>
            )}

            {projectOpen && (
              <div className="absolute left-44 top-11 z-30 w-72 rounded-xl border border-white/15 bg-[#0c1524] p-2 shadow-2xl">
                <p className="px-2 py-2 text-xs text-white/45">Choose a project in {workspaceName}</p>
                {projects.length ? projects.slice(0, 8).map((project) => {
                  const Icon = projectIcon(project.tool || project.type);
                  return (
                    <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-violet-500/15">
                      <Icon size={16} className="text-violet-300" /> {project.name}
                    </Link>
                  );
                }) : <p className="px-3 py-3 text-sm text-white/40">No projects yet</p>}
                <button type="button" onClick={() => { setProjectOpen(false); openCreate(); }} className="mt-1 flex w-full items-center gap-2 border-t border-white/10 px-3 py-3 text-left text-sm hover:text-violet-300">
                  <Plus size={15} /> Create new project
                </button>
              </div>
            )}
          </div>

          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_78%_45%,rgba(99,102,241,.24),transparent_34%),linear-gradient(120deg,#111827,#07111e)] p-6">
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl font-black">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight">{workspaceName}</h1>
                    <p className="text-sm text-violet-200/70">Personal workspace</p>
                  </div>
                </div>
                <p className="max-w-xl text-sm text-white/55">Build, create, and bring your ideas to life. Pick a project below to continue.</p>
              </div>
              <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold shadow-lg shadow-violet-950/40">
                <Plus size={16} /> New Project
              </button>
            </div>
          </section>

          <nav className="mb-4 flex gap-6 border-b border-white/10 px-1 pt-4 text-sm text-white/55">
            <a href="#overview" className="border-b-2 border-violet-500 px-1 py-3 font-semibold text-violet-300">Overview</a>
            <a href="#projects" className="px-1 py-3 hover:text-white">Projects</a>
            <Link href="/dashboard/collaboration" className="px-1 py-3 hover:text-white">Members</Link>
            <Link href="/dashboard/settings" className="px-1 py-3 hover:text-white">Settings</Link>
          </nav>

          <div id="overview" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ icon: Icon, value, label, className }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4">
                <div className={`grid h-10 w-10 place-items-center rounded-lg bg-white/5 ${className}`}><Icon size={20} /></div>
                <div><b className="block text-lg">{value}</b><span className="text-xs text-white/45">{label}</span></div>
              </div>
            ))}
          </div>

          <section id="projects">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div><h2 className="text-xl font-bold">Your Projects</h2><p className="text-sm text-white/45">Select a project to open its dashboard.</p></div>
              {projects.length > 6 && (
                <button type="button" onClick={() => setShowAllProjects((value) => !value)} className="text-xs text-blue-400 hover:underline">
                  {showAllProjects ? "Show recent" : "View all projects →"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-xl bg-white/5" />)}</div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-12 text-center">
                <WandSparkles className="mx-auto mb-4 text-violet-400" size={36} />
                <h3 className="font-bold">Create your first project</h3>
                <p className="mt-2 text-sm text-white/45">Create it here, then land directly on its project dashboard.</p>
                <button type="button" onClick={openCreate} className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold">New Project</button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {visibleProjects.map((project, index) => {
                  const type = project.tool || project.type;
                  const Icon = projectIcon(type);
                  return (
                    <article key={project.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1625] transition hover:-translate-y-0.5 hover:border-violet-500/40">
                      <Link href={`/dashboard/projects/${project.id}`} className={`block h-36 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,.7),transparent_25%),linear-gradient(135deg,#172554,#090f1b)] p-5 ${index % 3 === 1 ? "hue-rotate-90" : index % 3 === 2 ? "hue-rotate-180" : ""}`}>
                        <span className="inline-flex rounded-lg bg-black/25 p-2"><Icon size={22} /></span>
                        <p className="mt-7 text-xl font-black tracking-tight">{project.name}</p>
                      </Link>
                      <div className="p-4">
                        <div className="flex items-center gap-2"><Icon size={17} className="text-violet-300" /><h3 className="font-bold">{project.name}</h3></div>
                        <span className="mt-2 inline-block rounded-full border border-blue-500/40 px-2 py-0.5 text-[10px] text-blue-300">{projectLabel(type)}</span>
                        {project.description && <p className="mt-2 line-clamp-2 text-xs text-white/45">{project.description}</p>}
                        <p className="mt-3 text-xs text-white/40">Updated {relativeDate(project.updatedAt || project.updated_at)}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <Link href={`/dashboard/projects/${project.id}`} className="rounded-md bg-violet-600 px-2 py-2 text-center text-xs font-semibold">Open</Link>
                          <Link href={`/preview/${project.id}`} className="rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">Preview</Link>
                          <Link href={`/dashboard/projects/${project.id}/pages`} className="rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">Publish</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent Projects</h2><a href="#projects" className="text-[11px] text-blue-400">View all</a></div>
            <div className="divide-y divide-white/10">
              {recentProjects.map((project) => {
                const Icon = projectIcon(project.tool || project.type);
                return <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/10 text-blue-400"><Icon size={17} /></span><span className="min-w-0"><b className="block truncate text-sm">{project.name}</b><span className="text-[11px] text-white/40">Updated {relativeDate(project.updatedAt || project.updated_at)}</span></span></Link>;
              })}
              {!loading && !recentProjects.length && <p className="py-4 text-xs text-white/40">No recent projects</p>}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">Workspace Members</h2><Link href="/dashboard/collaboration" className="text-[11px] text-blue-400">Manage</Link></div>
            <div className="mt-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 font-bold">{displayName.charAt(0).toUpperCase()}</span><span className="min-w-0"><b className="block text-sm">{displayName}</b><span className="block truncate text-[11px] text-white/40">{email}</span></span></div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <h2 className="mb-3 font-bold">Resources</h2>
            <div className="space-y-3 text-sm text-white/60">
              <Link href="/docs" className="flex items-center gap-2 hover:text-white"><Folder size={15} /> Documentation</Link>
              <Link href="/templates" className="flex items-center gap-2 hover:text-white"><LayoutTemplate size={15} /> Templates</Link>
              <Link href="/3d-library" className="flex items-center gap-2 hover:text-white"><Box size={15} /> 3D Assets</Link>
              <Link href="/support" className="flex items-center gap-2 hover:text-white"><Sparkles size={15} /> Help & Support</Link>
            </div>
          </section>
        </aside>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) closeCreate(); }}>
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1626] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold">New Project</h2><p className="mt-1 text-sm text-white/45">Create it here. No extra setup page.</p></div>
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
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ["wonderbuild", "Website", Globe2],
                ["game", "3D / Game", Gamepad2],
                ["workspace", "Code / IDE", Box],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNewProjectType(value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm ${newProjectType === value ? "border-violet-500 bg-violet-500/15 text-white" : "border-white/10 text-white/55 hover:bg-white/5"}`}
                >
                  <Icon size={17} /> {label}
                </button>
              ))}
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
