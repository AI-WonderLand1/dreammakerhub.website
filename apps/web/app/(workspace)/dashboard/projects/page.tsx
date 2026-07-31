"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Folder, Pencil, Play, Code2, Trash2, Gamepad2, Globe, Box, Sparkles } from "lucide-react";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  updatedAt: string;
};

type Profile = {
  projects_limit: number;
};

const getProjectIcon = (type: string) => {
  const mapping: Record<string, React.ElementType> = {
    wonderbuild: Sparkles,
    game: Gamepad2,
    "3d_scene": Box,
    web_app: Globe,
    workspace: Code2,
    playcanvas: Play,
  };
  return mapping[type] || Pencil;
};

const getProjectColor = (type: string) => {
  const colors: Record<string, string> = {
    wonderbuild: "border-l-purple-500",
    game: "border-l-pink-500",
    "3d_scene": "border-l-blue-500",
    web_app: "border-l-green-500",
    workspace: "border-l-cyan-500",
    playcanvas: "border-l-blue-500",
  };
  return colors[type] || "border-l-gray-500";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<"wonderbuild" | "playcanvas">("wonderbuild");
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || `Request failed (${res.status})`);
    }
    const data = await res.json();
    return data.projects as Project[];
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError("Not authenticated");
            setLoading(false);
            return;
          }
          const profileRes = await supabase.from("user_profiles").select("projects_limit").eq("id", user.id).single();
          if (profileRes.data) setProfile(profileRes.data);
        }
        const list = await loadProjects();
        setProjects(list);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      if (profile && projects.length >= profile.projects_limit) {
        setError(`Project limit reached (${profile.projects_limit}). Upgrade to create more.`);
        setCreating(false);
        return;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim(), tool: newProjectType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create project");

      setProjects((prev) => [data.project, ...prev]);
      setShowCreate(false);
      setNewProjectName("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to delete project");
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-white/50">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-white/50">
            {projects.length} {profile ? `/ ${profile.projects_limit}` : ""} projects
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={profile !== null && projects.length >= profile.projects_limit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-4">Create New Project</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2">
              {(["wonderbuild", "playcanvas"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewProjectType(type)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    newProjectType === type
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {type === "wonderbuild" ? "Wonderbuild" : "Wonderplay"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newProjectName.trim()}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Folder size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-4">No projects yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white"
          >
            <Plus size={16} />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-xs text-white/50 uppercase">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.map((project) => {
                const Icon = getProjectIcon(project.tool || "wonderbuild");
                return (
                  <tr key={project.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border-l-2 ${getProjectColor(project.tool || "wonderbuild")}`}>
                          <Icon size={14} />
                        </div>
                        <div className="font-medium">{project.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white/60 capitalize">{project.tool || "wonderbuild"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {formatDate(project.updatedAt)}
                    </td>
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
