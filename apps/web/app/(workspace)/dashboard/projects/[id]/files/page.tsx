"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bot,
  CircleDot,
  Code2,
  Cpu,
  ExternalLink,
  FileCode2,
  GitPullRequest,
  HardDrive,
  PlayCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import RepositoryFileBrowser from "../RepositoryFileBrowser";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  type?: string | null;
  description?: string | null;
  updatedAt?: string;
  updated_at?: string;
};

const normalizeType = (value?: string | null) => (value || "").toLowerCase();

const projectTypeLabel = (value?: string | null) => {
  const type = normalizeType(value);
  if (["workspace", "code"].includes(type)) return "Code / IDE";
  if (["game", "3d", "3d_scene", "playcanvas"].includes(type)) return "3D Experience";
  if (type === "npc") return "NPC AI";
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(type)) return "AI App";
  return "Website";
};

const formatBytes = (files: Record<string, string>) => {
  const encoder = new TextEncoder();
  const bytes = Object.values(files).reduce((total, value) => total + encoder.encode(value || "").byteLength, 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ProjectCodeManagerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [projectResponse, filesResponse] = await Promise.all([
          fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" }),
          fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, { cache: "no-store" }),
        ]);

        const projectData = await projectResponse.json().catch(() => ({}));
        if (!projectResponse.ok || !projectData?.project) {
          throw new Error(projectData?.message || "Project not found");
        }

        const fileData = await filesResponse.json().catch(() => ({}));
        if (!filesResponse.ok) {
          throw new Error(fileData?.message || fileData?.error || "Project files could not be loaded");
        }

        if (!cancelled) {
          setProject(projectData.project);
          setFiles(fileData?.files && typeof fileData.files === "object" ? fileData.files : {});
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to open code manager");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const tool = project?.tool || project?.type || "wonderbuild";
  const projectQuery = `projectId=${encodeURIComponent(projectId)}`;
  const initialPath = searchParams.get("path");
  const storage = useMemo(() => formatBytes(files), [files]);

  const tabs = [
    { label: "Code", href: `/dashboard/projects/${projectId}/files`, icon: Code2, active: true },
    { label: "Issues", href: `/dashboard/support?${projectQuery}`, icon: CircleDot },
    { label: "Pull requests", href: `/dashboard/collaboration?${projectQuery}&view=reviews`, icon: GitPullRequest },
    { label: "AI Agents", href: `/dashboard/agents?${projectQuery}`, icon: Bot },
    { label: "Actions", href: `/dashboard/usage?${projectQuery}`, icon: PlayCircle },
    { label: "Security", href: `/dashboard/aetherguard?${projectQuery}`, icon: ShieldCheck },
    { label: "Insights", href: `/dashboard/analytics?${projectQuery}`, icon: BarChart3 },
    { label: "Settings", href: `/dashboard/settings?${projectQuery}`, icon: Settings },
  ];

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center text-sm text-white/45">Opening AI Wonderland Code Manager...</div>;
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="font-semibold text-red-200">Code manager could not open.</p>
        <p className="mt-2 text-sm text-red-200/70">{error || "Project not found"}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">← Back to workspace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] text-white">
      <header className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1423]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/dashboard" className="text-cyan-300 hover:text-cyan-200">Workspace</Link>
              <span className="text-white/25">/</span>
              <Link href={`/dashboard/projects/${project.id}`} className="truncate font-semibold text-white hover:text-violet-200">{project.name}</Link>
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                {projectTypeLabel(tool)}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/35">Project code, files, AI tools, and cloud IDE in one route.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/agents?${projectQuery}`}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/15"
            >
              <Sparkles size={15}/> Ask AI Wonderland
            </Link>
            <Link
              href={`/wonderspace?${projectQuery}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-3 py-2 text-xs font-bold shadow-lg shadow-violet-950/30"
            >
              <ExternalLink size={15}/> Open WonderSpace IDE
            </Link>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/10 px-2 text-sm text-white/55">
          {tabs.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 transition hover:bg-white/[.03] hover:text-white ${active ? "border-violet-500 bg-violet-500/[.04] font-semibold text-white" : "border-transparent"}`}
            >
              <Icon size={16}/>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>
      )}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <RepositoryFileBrowser
            projectId={project.id}
            projectType={tool}
            files={files}
            initialPath={initialPath}
            onFilesChange={setFiles}
          />
        </main>

        <aside className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-[#0c1425] p-4">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,.28),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(6,182,212,.16),transparent_38%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-violet-300">
                <WandSparkles size={14}/> AI Wonderland
              </div>
              <h2 className="mt-3 text-lg font-black">Code Companion</h2>
              <p className="mt-2 text-xs leading-5 text-white/45">
                Keep project context beside the editor instead of bouncing through disconnected tools.
              </p>
              <Link href={`/dashboard/agents?${projectQuery}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2.5 text-xs font-bold">
                <Sparkles size={14}/> Open AI Agents
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0c1625] p-4">
            <h2 className="text-sm font-bold">Project Runtime</h2>
            <dl className="mt-3 divide-y divide-white/10 text-xs">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2 text-white/40"><FileCode2 size={14}/> Files</dt>
                <dd className="font-semibold">{Object.keys(files).length}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2 text-white/40"><HardDrive size={14}/> Storage</dt>
                <dd className="font-semibold">{storage}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2 text-white/40"><Cpu size={14}/> Project type</dt>
                <dd className="text-right font-semibold">{projectTypeLabel(tool)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0c1625] p-4">
            <h2 className="text-sm font-bold">Wonderland Tools</h2>
            <div className="mt-3 space-y-2">
              <Link href={`/wonderspace?${projectQuery}`} className="flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[.035] px-3 py-2.5 text-xs text-cyan-100 hover:bg-cyan-400/[.07]">
                <Code2 size={14}/> WonderSpace IDE
              </Link>
              <Link href={`/wonder-build/builder?${projectQuery}`} className="flex items-center gap-2 rounded-lg border border-violet-400/15 bg-violet-400/[.035] px-3 py-2.5 text-xs text-violet-100 hover:bg-violet-400/[.07]">
                <WandSparkles size={14}/> WonderBuild
              </Link>
              <Link href={`/dashboard/aetherguard?${projectQuery}`} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/65 hover:bg-white/5 hover:text-white">
                <ShieldCheck size={14}/> Security & Quality
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#10172a,#0a1320)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300/70">Project route</p>
            <code className="mt-2 block break-all rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-[10px] text-white/45">
              /dashboard/projects/{project.id}/files
            </code>
            <Link href={`/dashboard/projects/${project.id}`} className="mt-3 inline-block text-xs text-cyan-300 hover:underline">
              Project overview →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
