"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Folder, Globe, Pencil, Trash2, Download, Sparkles, Box, Gamepad2, Code2 } from "lucide-react";
import WonderRealtimeWidget from "@/app/(workspace)/dashboard/components/WonderRealtimeWidget";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const getProjectIcon = (tool?: string | null) => {
  const mapping: Record<string, React.ElementType> = {
    wonderbuild: Sparkles,
    game: Gamepad2,
    "3d_scene": Box,
    web_app: Code2,
    workspace: Code2,
    playcanvas: Box,
  };
  return mapping[tool || "wonderbuild"] || Sparkles;
};

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data?.message || "Project not found");
        setProject(data.project);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const handleDelete = async () => {
    if (!confirm(`Delete "${project?.name}" and all its files?`)) return;
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to delete project");
      }
      router.push("/dashboard/projects");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownloadZip = () => {
    window.location.href = `/api/projects/${projectId}/export?format=zip`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-white/50">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-white/60">{error || "Project not found"}</div>
        <Link href="/dashboard/projects" className="text-sm text-blue-400 hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const Icon = getProjectIcon(project.tool);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Icon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{project.name}</h1>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
                {project.tool || "wonderbuild"}
              </span>
            </div>
            <div className="text-xs text-white/40">ID: {project.id.slice(0, 8)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/wonder-build?projectId=${project.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90"
          >
            <Pencil size={14} /> Open in Builder
          </Link>
          <button
            onClick={handleDownloadZip}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10"
          >
            <Download size={14} /> Download ZIP
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-red-400/80 hover:bg-white/10"
            title="Delete project"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/dashboard/projects/${project.id}/files`}
          className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <Folder className="w-8 h-8 mb-2 text-blue-400" />
          <div className="font-medium">Files</div>
          <div className="text-xs text-white/50">
            Browse, edit, and manage your project&apos;s files and folders. Import a repo or download the whole project as ZIP.
          </div>
        </Link>

        <Link
          href={`/dashboard/projects/${project.id}/pages`}
          className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <Globe className="w-8 h-8 mb-2 text-emerald-400" />
          <div className="font-medium">Pages</div>
          <div className="text-xs text-white/50">Published pages for this project — view, toggle live/draft, and delete.</div>
        </Link>
      </div>

      <div className="mt-4">
        <WonderRealtimeWidget projectId={project.id} title="Live project activity" />
      </div>
    </div>
  );
}
