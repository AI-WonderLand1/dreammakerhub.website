"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Clock3, Code2, Copy, Download, ExternalLink, FileText, Folder,
  Gamepad2, Globe2, HardDrive, Pencil, Settings, Sparkles, Trash2, Users,
} from "lucide-react";
import WonderRealtimeWidget from "@/app/(workspace)/dashboard/components/WonderRealtimeWidget";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  type?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  description?: string | null;
};

const is3dType = (tool?: string | null) =>
  ["game", "3d_scene", "playcanvas"].includes(tool || "");

const typeLabel = (tool?: string | null) => {
  if (is3dType(tool)) return "3D Experience";
  if (tool === "workspace") return "IDE Project";
  return "Website";
};

const projectIcon = (tool?: string | null) => {
  if (is3dType(tool)) return Gamepad2;
  if (tool === "workspace") return Code2;
  return Globe2;
};

const formatDate = (value?: string) => {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Personal Workspace");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data?.message || "Project not found");
        setProject(data.project);

        const { createClient } = await import("@/lib/supabase/client");
        const client = createClient();
        if (client) {
          const { data: { user } } = await client.auth.getUser();
          const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0];
          if (name) setWorkspaceName(`${name}'s Workspace`);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Project not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  async function handleDelete() {
    if (!project || !confirm(`Delete "${project.name}" and all its files?`)) return;
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
    if (response.ok) router.push("/dashboard");
    else setError("Failed to delete project");
  }

  function downloadZip() {
    window.location.href = `/api/projects/${projectId}/export?format=zip`;
  }

  if (loading) return <div className="p-8 text-sm text-white/50 animate-pulse">Loading project...</div>;
  if (!project) return (
    <div className="p-8">
      <p className="mb-3 text-red-300">{error || "Project not found"}</p>
      <Link href="/dashboard" className="text-sm text-blue-400">← Back to workspace</Link>
    </div>
  );

  const tool = project.tool || project.type || "wonderbuild";
  const Icon = projectIcon(tool);
  const builderHref = is3dType(tool)
    ? `/dashboard/3dhub?projectId=${project.id}`
    : `/wonder-build?projectId=${project.id}`;

  const tabs = [
    ["Overview", `/dashboard/projects/${project.id}`],
    ["Files", `/dashboard/projects/${project.id}/files`],
    ["Pages", `/dashboard/projects/${project.id}/pages`],
    ["Assets", "/3d-library"],
    ["Deployments", `/dashboard/projects/${project.id}/pages`],
    ["Collaborators", "/dashboard/collaboration"],
    ["Settings", "/dashboard/settings"],
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080e19] text-white">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-white/55">
        <Link href="/dashboard" className="hover:text-white">{workspaceName}</Link>
        <span className="text-white/25">/</span>
        <span className="font-semibold text-white">{project.name}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <main className="min-w-0">
          <section className="mb-4 grid gap-5 lg:grid-cols-[340px_1fr]">
            <div className="relative flex h-48 items-end overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,.75),transparent_27%),linear-gradient(135deg,#172554,#090f1b)] p-5">
              <div><span className="mb-3 inline-flex rounded-lg bg-black/25 p-2"><Icon size={22}/></span><p className="text-2xl font-black">{project.name}</p></div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-4xl font-black tracking-tight">{project.name}</h1>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full border border-blue-500/50 px-2.5 py-1 text-[11px] text-blue-300">{typeLabel(tool)}</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50">Draft</span>
                  </div>
                </div>
                <button type="button" onClick={handleDelete} title="Delete project" className="rounded-lg p-2 text-red-300/70 hover:bg-red-500/10"><Trash2 size={17}/></button>
              </div>
              <p className="mt-4 max-w-xl text-sm text-white/50">{project.description || `Create, edit, preview, and publish ${project.name} from one place.`}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={builderHref} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold">
                  <Pencil size={15}/> Open in {is3dType(tool) ? "3D Studio" : "WonderBuild"}
                </Link>
                <Link href={`/wonderspace?projectId=${project.id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
                  <Code2 size={15}/> Open in WonderSpace IDE
                </Link>
                <Link href={`/preview/${project.id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5">
                  <ExternalLink size={15}/> Preview
                </Link>
                <Link href={`/dashboard/projects/${project.id}/pages`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold">
                  <Globe2 size={15}/> Publish
                </Link>
              </div>
            </div>
          </section>

          <nav className="mb-4 flex gap-6 overflow-x-auto border-b border-white/10 text-sm text-white/50">
            {tabs.map(([label, href], index) => <Link key={label} href={href} className={`whitespace-nowrap px-1 py-3 hover:text-white ${index === 0 ? "border-b-2 border-violet-500 font-semibold text-violet-300" : ""}`}>{label}</Link>)}
          </nav>

          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Clock3, "Last saved", formatDate(project.updatedAt || project.updated_at), "text-emerald-400"],
              [Globe2, "Deployment", "Not published", "text-amber-400"],
              [HardDrive, "Storage", "Project files", "text-violet-400"],
              [Users, "Collaborators", "1", "text-cyan-400"],
            ].map(([CardIcon, label, value, color]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4">
                <span className={`grid h-10 w-10 place-items-center rounded-lg bg-white/5 ${color}`}><CardIcon size={20}/></span>
                <span><small className="block text-white/40">{label}</small><b className="text-sm">{value}</b></span>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
            <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1625]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h2 className="font-bold">Live Preview</h2><Link href={`/preview/${project.id}`} className="text-blue-400"><ExternalLink size={15}/></Link></div>
              <div className="flex min-h-72 items-center justify-center bg-[radial-gradient(circle_at_60%_40%,rgba(99,102,241,.35),transparent_30%),linear-gradient(135deg,#111827,#050914)] p-8 text-center">
                <div><Icon className="mx-auto mb-4 text-violet-300" size={42}/><h3 className="text-2xl font-black">{project.name}</h3><p className="mt-2 text-sm text-white/45">Open the preview to see your latest saved work.</p><Link href={`/preview/${project.id}`} className="mt-5 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold">Open Preview</Link></div>
              </div>
            </section>

            <div className="space-y-4">
              <section className="rounded-xl border border-white/10 bg-[#0d1625]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h2 className="font-bold">Project Files</h2><Link href={`/dashboard/projects/${project.id}/files`} className="text-xs text-blue-400">View all files →</Link></div>
                <div className="divide-y divide-white/5 px-4">
                  {[["app", Folder], ["components", Folder], ["public", Folder], ["package.json", FileText], ["README.md", FileText]].map(([name, FileIcon]) => <Link key={String(name)} href={`/dashboard/projects/${project.id}/files`} className="flex items-center gap-2 py-2.5 text-sm text-white/65 hover:text-white"><FileIcon size={15} className="text-blue-400"/>{String(name)}</Link>)}
                </div>
              </section>
              <section className="rounded-xl border border-white/10 bg-[#0d1625]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h2 className="font-bold">Pages</h2><Link href={`/dashboard/projects/${project.id}/pages`} className="text-xs text-blue-400">Manage →</Link></div>
                <div className="space-y-2 p-4 text-sm">
                  {["Home", "About", "Contact"].map((page, index) => <div key={page} className="flex justify-between text-white/65"><span>{page}</span><span className={index === 0 ? "text-emerald-400" : "text-white/35"}>{index === 0 ? "Ready" : "Draft"}</span></div>)}
                </div>
              </section>
            </div>
          </div>

          <div className="mt-4"><WonderRealtimeWidget projectId={project.id} title="Recent Activity" /></div>
        </main>

        <aside className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Project Details</h2><Settings size={16} className="text-blue-400"/></div>
            <dl className="divide-y divide-white/10 text-sm">
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Project ID</dt><dd className="font-mono text-xs">{project.id.slice(0, 12)}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Workspace</dt><dd className="text-right">{workspaceName}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Created</dt><dd>{formatDate(project.createdAt || project.created_at)}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Project type</dt><dd>{typeLabel(tool)}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Status</dt><dd className="text-white/60">Draft</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <h2 className="mb-3 font-bold">Quick Actions</h2>
            <div className="space-y-2">
              <button type="button" onClick={() => navigator.clipboard?.writeText(project.id)} className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5"><Copy size={15}/> Copy project ID</button>
              <button type="button" onClick={downloadZip} className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5"><Download size={15}/> Export project</button>
              <Link href="/dashboard/collaboration" className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5"><Users size={15}/> Invite collaborator</Link>
            </div>
          </section>

          <Link href="/dashboard" className="block rounded-xl border border-white/10 p-4 text-center text-sm text-blue-400 hover:bg-white/5">← Back to workspace</Link>
        </aside>
      </div>
    </div>
  );
}
