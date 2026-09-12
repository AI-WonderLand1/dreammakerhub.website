"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  Download,
  ExternalLink,
  GitPullRequest,
  Globe2,
  HardDrive,
  MessageSquare,
  PanelsTopLeft,
  Pencil,
  PlayCircle,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import WonderRealtimeWidget from "@/app/(workspace)/dashboard/components/WonderRealtimeWidget";
import RepositoryFileBrowser from "./RepositoryFileBrowser";

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
  publishEnabled?: boolean;
  customDomain?: string | null;
  lastPublishId?: string | null;
};

type PublishedPage = {
  id: string;
  published?: boolean;
  content?: {
    kind?: string;
    wonderBuild?: {
      projectId?: string;
      pageId?: string;
      pageSlug?: string;
    };
  } | null;
};

const is3dType = (tool?: string | null) =>
  ["game", "3d_scene", "playcanvas"].includes(tool || "");

const typeLabel = (tool?: string | null) => {
  if (is3dType(tool)) return "3D Experience";
  if (tool === "workspace") return "IDE Project";
  return "Website";
};

const formatDate = (value?: string) => {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "Recently";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [publishedPageIds, setPublishedPageIds] = useState<string[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Personal Workspace");
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjectData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [projectResponse, filesResponse, publishedResponse] = await Promise.all([
        fetch(`/api/projects/${encodeURIComponent(projectId)}`),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/files`),
        fetch("/api/pages?limit=100"),
      ]);

      const projectData = await projectResponse.json().catch(() => ({}));
      if (!projectResponse.ok || !projectData.ok) {
        throw new Error(projectData?.message || "Project not found");
      }
      setProject(projectData.project);

      if (filesResponse.ok) {
        const fileData = await filesResponse.json().catch(() => ({}));
        const nextFiles = fileData?.files && typeof fileData.files === "object"
          ? fileData.files as Record<string, string>
          : {};
        setFiles(nextFiles);
      }

      if (publishedResponse.ok) {
        const publishedData = await publishedResponse.json().catch(() => ({}));
        const rows = Array.isArray(publishedData?.data) ? publishedData.data as PublishedPage[] : [];
        setPublishedPageIds(
          rows
            .filter((row) => row.published && row.content?.wonderBuild?.projectId === projectId)
            .map((row) => row.content?.wonderBuild?.pageId)
            .filter((id): id is string => Boolean(id)),
        );
      }

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
      if (showLoader) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProjectData(true);
  }, [loadProjectData]);

  const storageBytes = useMemo(() => {
    const encoder = new TextEncoder();
    return Object.values(files).reduce(
      (total, content) => total + encoder.encode(content || "").byteLength,
      0,
    );
  }, [files]);

  const isPublished = publishedPageIds.length > 0 || Boolean(project?.publishEnabled || project?.lastPublishId);

  async function duplicateProject() {
    if (!project || duplicating) return;
    setDuplicating(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${project.name} Copy`,
          tool: project.tool || project.type || "wonderbuild",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.project?.id) {
        throw new Error(data?.message || "Failed to duplicate project");
      }

      if (Object.keys(files).length > 0) {
        const copyResponse = await fetch(`/api/projects/${encodeURIComponent(data.project.id)}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files }),
        });
        if (!copyResponse.ok) throw new Error("Project created, but files could not be copied");
      }

      router.push(`/dashboard/projects/${encodeURIComponent(data.project.id)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to duplicate project");
    } finally {
      setDuplicating(false);
    }
  }

  function downloadZip() {
    window.location.href = `/api/projects/${projectId}/export?format=zip`;
  }

  if (loading) {
    return <div className="p-8 text-sm text-white/50 animate-pulse">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="mb-3 text-red-300">{error || "Project not found"}</p>
        <Link href="/dashboard" className="text-sm text-blue-400">← Back to workspace</Link>
      </div>
    );
  }

  const tool = project.tool || project.type || "wonderbuild";
  const builderHref = is3dType(tool)
    ? `/dashboard/3dhub?projectId=${encodeURIComponent(project.id)}`
    : `/wonder-build/builder?projectId=${encodeURIComponent(project.id)}`;
  const projectQuery = `projectId=${encodeURIComponent(project.id)}`;

  const repoTabs = [
    { label: "Code", href: `/dashboard/projects/${project.id}`, icon: Code2, active: true },
    { label: "Issues", href: `/dashboard/support?${projectQuery}`, icon: CircleDot },
    { label: "Pull requests", href: `/dashboard/collaboration?${projectQuery}&view=reviews`, icon: GitPullRequest },
    { label: "Agents", href: `/dashboard/agents?${projectQuery}`, icon: Bot },
    { label: "Discussions", href: `/dashboard/collaboration?${projectQuery}`, icon: MessageSquare },
    { label: "Actions", href: `/dashboard/usage?${projectQuery}`, icon: PlayCircle },
    { label: "Projects", href: "/dashboard#projects", icon: PanelsTopLeft },
    { label: "Wiki", href: "/docs", icon: BookOpen },
    { label: "Security & quality", href: `/dashboard/aetherguard?${projectQuery}`, icon: ShieldCheck },
    { label: "Insights", href: `/dashboard/analytics?${projectQuery}`, icon: BarChart3 },
    { label: "Settings", href: `/dashboard/settings?${projectQuery}`, icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#07101b] text-white">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/60">
        <Link href="/dashboard" className="hover:text-white">{workspaceName}</Link>
        <span className="text-white/25">›</span>
        <span className="font-semibold text-white">{project.name}</span>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0">
          <section className="mb-3 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="relative h-48 overflow-hidden rounded-xl border border-white/10 bg-[#0b1422]">
              <iframe
                src={`/preview/${encodeURIComponent(project.id)}`}
                title={`${project.name} preview thumbnail`}
                className="h-full w-full border-0 bg-[#08111e] pointer-events-none"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <h1 className="truncate text-4xl font-black tracking-tight">{project.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-500/50 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300">{typeLabel(tool)}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/55">{isPublished ? "Published" : "Draft"}</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
                {project.description || `Manage, edit, preview, and publish ${project.name} from one project dashboard.`}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={builderHref} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold shadow-lg shadow-violet-950/30">
                  <Pencil size={15}/> Open in {is3dType(tool) ? "3D Studio" : "WonderBuild"}
                </Link>
                <Link href={`/wonderspace?projectId=${encodeURIComponent(project.id)}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[.035] px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
                  <Code2 size={15}/> Open in WonderSpace IDE
                </Link>
                <Link href={`/preview/${project.id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5">
                  <ExternalLink size={15}/> Preview
                </Link>
                <Link href={`/dashboard/projects/${project.id}/pages`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold hover:bg-blue-500">
                  <Globe2 size={15}/> Publish
                </Link>
              </div>
            </div>
          </section>

          <nav className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-white/10 text-sm text-white/60">
            {repoTabs.map(({ label, href, icon: TabIcon, active }) => (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 transition hover:bg-white/[.035] hover:text-white ${active ? "border-violet-500 font-semibold text-white" : "border-transparent"}`}
              >
                <TabIcon size={17}/>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
          )}

          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [Clock3, "Last saved", formatRelativeTime(project.updatedAt || project.updated_at), "text-emerald-400"],
              [Globe2, "Deployment", isPublished ? "Published" : "Not published", "text-amber-400"],
              [HardDrive, "Storage", formatBytes(storageBytes), "text-violet-400"],
              [Users, "Collaborators", onlineCount > 0 ? `${onlineCount} online` : "Owner", "text-cyan-400"],
            ].map(([CardIcon, label, value, color]) => (
              <div key={String(label)} className="flex min-h-20 items-center gap-3 rounded-xl border border-white/10 bg-[#0d1625] p-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/5 ${String(color)}`}>
                  <CardIcon size={20}/>
                </span>
                <span className="min-w-0">
                  <small className="block text-white/40">{String(label)}</small>
                  <b className="block truncate text-sm">{String(value)}</b>
                </span>
              </div>
            ))}
          </div>

          <RepositoryFileBrowser
            projectId={project.id}
            files={files}
            updatedLabel={formatRelativeTime(project.updatedAt || project.updated_at)}
          />
        </main>

        <aside className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Project Details</h2>
              <Link href="/dashboard/settings" className="text-xs text-blue-400">Edit</Link>
            </div>
            <dl className="divide-y divide-white/10 text-sm">
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-white/40">Project ID</dt>
                <dd className="flex items-center gap-2 font-mono text-xs">
                  <span>{project.id.slice(0, 12)}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(project.id)}
                    className="text-white/35 hover:text-white"
                    aria-label="Copy project ID"
                  >
                    <Copy size={13}/>
                  </button>
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Workspace</dt><dd className="text-right">{workspaceName}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Created</dt><dd>{formatDate(project.createdAt || project.created_at)}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Project type</dt><dd>{typeLabel(tool)}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-white/40">Status</dt><dd className={isPublished ? "text-emerald-400" : "text-white/60"}>{isPublished ? "Published" : "Draft"}</dd></div>
              {project.description && (
                <div className="py-3">
                  <dt className="mb-2 text-white/40">Description</dt>
                  <dd className="text-xs leading-5 text-white/65">{project.description}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
            <h2 className="mb-3 font-bold">Quick Actions</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void duplicateProject()}
                disabled={duplicating}
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                <Copy size={15}/>{duplicating ? "Duplicating..." : "Duplicate project"}
              </button>
              <button
                type="button"
                onClick={downloadZip}
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5"
              >
                <Download size={15}/> Export project
              </button>
              <Link href="/dashboard/collaboration" className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/5">
                <Users size={15}/> Invite collaborator
              </Link>
            </div>
          </section>

          <WonderRealtimeWidget
            projectId={project.id}
            title="Recent Activity"
            compact
            showTestButton={false}
            onActivity={() => void loadProjectData(false)}
            onPresenceChange={(users) => setOnlineCount(users.length)}
          />
        </aside>
      </div>
    </div>
  );
}
