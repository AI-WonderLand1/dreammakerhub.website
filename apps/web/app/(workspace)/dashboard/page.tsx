"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Folder,
  FolderOpen,
  Pencil,
  Play,
  Globe,
  Trash2,
  LayoutTemplate,
  Plus,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  updatedAt: string;
};

const getFolderIcon = (type: string) => (type === "playcanvas" ? Play : Folder);

const getFolderColor = (type: string) => {
  const colors: Record<string, string> = {
    wonderbuild: "border-l-purple-500",
    playcanvas: "border-l-blue-500",
    game: "border-l-pink-500",
    "3d_scene": "border-l-blue-500",
    web_app: "border-l-green-500",
    workspace: "border-l-cyan-500",
  };
  return colors[type] || "border-l-gray-500";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/dashboard/projects");
      return;
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/public-pages/auth");
        return;
      }
      setUserEmail(user?.email || null);
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch {
        /* folder list best-effort */
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const handleDelete = useCallback(async (projectId: string) => {
    if (!confirm("Delete this folder?")) return;
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
      if (!res.ok) return;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {
      /* best-effort delete */
    }
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-400" />
            Files &amp; Folders
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {loading
              ? "Loading your workspace..."
              : `Welcome${userEmail ? `, ${userEmail}` : ""} — read and edit any file or folder below.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/templates"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/40 bg-violet-600/15 text-sm font-medium text-violet-200 hover:bg-violet-600/25 transition"
          >
            <LayoutTemplate className="w-4 h-4" />
            Template library
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-400 transition"
          >
            <Plus size={16} />
            New Folder
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-white/50 animate-pulse">Loading folders...</div>
      ) : projects.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <Folder size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-2">No folders yet. Create one, or start from a template.</p>
          <div className="flex justify-center gap-3 mt-4">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm"
            >
              <Plus size={16} />
              New Folder
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition"
            >
              <LayoutTemplate size={16} />
              Template library
            </Link>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-xs text-white/50 uppercase">
                <th className="px-4 py-3">Folder</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.map((project) => {
                const Icon = getFolderIcon(project.tool || "wonderbuild");
                return (
                  <tr key={project.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/projects/${project.id}/files`}
                        className="flex items-center gap-3 group"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border-l-2 ${getFolderColor(project.tool || "wonderbuild")}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-blue-400 transition-colors">{project.name}</div>
                          <div className="text-[10px] text-white/40">open files &amp; folders</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white/60 capitalize">{project.tool || "wonderbuild"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">{formatDate(project.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/wonder-build?projectId=${project.id}`}
                          className="p-2 rounded hover:bg-white/10"
                          title="Open in Builder"
                        >
                          <Pencil size={14} />
                        </Link>
                        <Link
                          href={`/dashboard/projects/${project.id}/files`}
                          className="p-2 rounded hover:bg-white/10"
                          title="File Manager"
                        >
                          <Folder size={14} />
                        </Link>
                        <Link
                          href={`/dashboard/projects/${project.id}/pages`}
                          className="p-2 rounded hover:bg-white/10"
                          title="Published Pages"
                        >
                          <Globe size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 rounded hover:bg-white/10 text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}