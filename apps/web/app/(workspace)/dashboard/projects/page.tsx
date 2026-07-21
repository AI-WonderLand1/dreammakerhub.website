"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserLimits, formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";
import { Plus, Folder, Pencil, Play, Code2, ExternalLink, Trash2, MoreVertical, Gamepad2, Globe, Box, Sparkles, X } from "lucide-react";
import { logger } from '@/lib/logger';

type Project = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

type Profile = {
  projects_limit: number;
};

type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { id: "wonderbuild", name: "Wonderbuild AI", description: "AI-powered website builder", icon: Sparkles, color: "border-l-purple-500" },
  { id: "wonderbuild_ui", name: "Wonderbuild UI", description: "Visual drag-and-drop editor", icon: Pencil, color: "border-l-orange-500" },
  { id: "game", name: "Game Project", description: "Interactive game with WonderPlay 3D", icon: Gamepad2, color: "border-l-pink-500" },
  { id: "3d_scene", name: "3D Scene", description: "3D environment with WonderPlay 3D", icon: Box, color: "border-l-blue-500" },
  { id: "web_app", name: "Web App", description: "Code-first web application", icon: Globe, color: "border-l-green-500" },
  { id: "workspace", name: "Code Workspace", description: "WonderSpace IDE", icon: Code2, color: "border-l-cyan-500" },
];

const getProjectIcon = (type: string) => {
  const mapping: Record<string, React.ElementType> = {
    wonderbuild: Sparkles,
    wonderbuild_ui: Pencil,
    game: Gamepad2,
    "3d_scene": Box,
    web_app: Globe,
    workspace: Code2,
    playcanvas: Play,
    puck: Pencil,
  };
  return mapping[type] || Pencil;
};

const getProjectColor = (type: string) => {
  const colors: Record<string, string> = {
    wonderbuild: "border-l-purple-500",
    wonderbuild_ui: "border-l-orange-500",
    game: "border-l-pink-500",
    "3d_scene": "border-l-blue-500",
    web_app: "border-l-green-500",
    workspace: "border-l-cyan-500",
    playcanvas: "border-l-blue-500",
    puck: "border-l-orange-500",
  };
  return colors[type] || "border-l-gray-500";
};

const getEditorUrl = (project: Project): string => {
  const mapping: Record<string, string> = {
    wonderbuild: "/wonder-build",
    wonderbuild_ui: "/wonder-build/puck",
    game: "/wonder-build/playcanvas",
    "3d_scene": "/wonder-build/playcanvas",
    web_app: "/wonder-build/ai-builder",
    workspace: "/wonderspace/ide",
    playcanvas: "/wonder-build/playcanvas",
    puck: "/wonder-build/puck",
  };
  return `${mapping[project.type] || "/wonder-build"}?projectId=${project.id}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<"wonderbuild" | "playcanvas" | "puck">("wonderbuild");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase not configured");
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const [projectsRes, profileRes] = await Promise.all([
          supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(50),
          supabase.from("user_profiles").select("projects_limit").eq("id", user.id).single(),
        ]);

        if (projectsRes.data) setProjects(projectsRes.data);
        if (profileRes.data) setProfile(profileRes.data);
        if (projectsRes.error) throw projectsRes.error;
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    
    const supabase = createClient();
    if (!supabase) return;

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (profile && projects.length >= profile.projects_limit) {
        setError(`Project limit reached (${profile.projects_limit}). Upgrade to create more.`);
        setCreating(false);
        return;
      }

      const { error } = await supabase.from("projects").insert({
        owner_id: user.id,
        name: newProjectName.trim(),
        type: newProjectType,
        status: "active",
      });

      if (error) throw error;

      const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(50);
      if (data) setProjects(data);
      
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
    
    const supabase = createClient();
    if (!supabase) return;

    try {
      await supabase.from("projects").delete().eq("id", projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
            {projects.length} / {profile?.projects_limit || 1} projects used
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={profile && projects.length >= profile.projects_limit}
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
              {(["wonderbuild", "playcanvas", "puck"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewProjectType(type)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    newProjectType === type
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {type === "wonderbuild" ? "Wonderbuild" : type === "playcanvas" ? "Wonderplay" : "Wonderbuild UI"}
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
          <Link
            href="/wonder-build/agent"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white"
          >
            <Plus size={16} />
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-xs text-white/50 uppercase">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.map((project) => {
                const Icon = getProjectIcon(project.type);
                return (
                  <tr key={project.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border-l-2 ${getProjectColor(project.type)}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-xs text-white/40">{project.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white/60 capitalize">{project.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === "active" 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-white/10 text-white/40"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {formatDate(project.updated_at)}
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