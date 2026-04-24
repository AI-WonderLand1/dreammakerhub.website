"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  FolderIcon, 
  FileIcon, 
  CodeIcon, 
  GitPullRequestIcon, 
  SettingsIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  GitBranchIcon,
  ClockIcon,
  EyeIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  ExternalLinkIcon,
  BarChartIcon
} from "lucide-react";
import ProjectImportExport from "./ProjectImportExport";
import SettingsMenu from "./components/SettingsMenu";
import GhostLinksSection from "./components/GhostLinksSection";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";

type Project = {
  id: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  language?: string;
  previewUrl?: string;
};

function toastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const TABS = [
  { id: "code", label: "Code", icon: CodeIcon },
  { id: "issues", label: "Issues", icon: FileIcon },
  { id: "pullrequests", label: "Pull Requests", icon: GitPullRequestIcon },
  { id: "actions", label: "Actions", icon: SettingsIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

async function downloadFromExport(projectId: string) {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/export`, {
    method: "GET",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
  const filename = (m?.[1] ? decodeURIComponent(m[1]) : null) ?? `project-${projectId}.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getProjectLanguage(name: string | undefined): string {
  if (!name) return "TypeScript";
  const lower = name.toLowerCase();
  if (lower.includes("3d") || lower.includes("scene") || lower.includes("playcanvas")) return "JavaScript";
  if (lower.includes("puck") || lower.includes("ui") || lower.includes("web")) return "HTML";
  if (lower.includes("ai") || lower.includes("agent") || lower.includes("bot")) return "Python";
  return "TypeScript";
}

function getCommitMessage(name: string | undefined, updatedAt: string | undefined): string {
  if (!name) return "Initial commit";
  const date = updatedAt ? new Date(updatedAt).toLocaleDateString() : "recently";
  return `Updated ${name.toLowerCase()} • ${date}`;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeTab, setActiveTab] = useState("code");
  const [searchQuery, setSearchQuery] = useState("");

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = toastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/projects", { method: "GET" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to load projects (${res.status})`);
      }
      const json = (await res.json()) as any;
      const list: Project[] = Array.isArray(json) ? json : (json?.projects ?? []);
      setProjects(list);
    } catch (e: any) {
      const message = e?.message ?? "Failed to load projects";
      setErr(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...projects];
    copy.sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });
    return copy;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.id.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    
    setBusyId(projectId);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      pushToast("Project deleted.", "success");
      load();
    } catch (e: any) {
      pushToast(e?.message ?? "Delete failed", "error");
    } finally {
      setBusyId(null);
    }
  }, [load, pushToast]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <ToastStack toasts={toasts} />
      
      <div className="max-w-[1280px] mx-auto">
        {/* Breadcrumb Header */}
        <div className="border-b border-[#21262d] px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#8b949e] hover:text-white">
              DreamMakerHub
            </Link>
            <span className="text-[#484f58]">/</span>
            <span className="text-white font-semibold">Ai-Wonderland</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#1f6feb26] text-[#58a6ff] border border-[#388bfd33]">
              Public
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#21262d] px-4">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "text-white border-[#f78166] bg-[#161b22]"
                      : "text-[#8b949e] border-transparent hover:text-white hover:bg-[#21262d]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Left Content - File List */}
          <div className="flex-1 border-r border-[#21262d]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262d]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-64 h-8 pl-9 pr-3 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-white placeholder:text-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                </div>
                <button
                  onClick={load}
                  disabled={loading}
                  className="p-2 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/wonder-build"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#238636] text-white text-sm font-medium hover:bg-[#2ea043] transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  New Project
                </Link>
              </div>
            </div>

            {/* File List */}
            <div className="divide-y divide-[#21262d]">
              {loading ? (
                <div className="p-4 text-[#8b949e]">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-[#8b949e] mb-4">No projects found</div>
                  <Link
                    href="/wonder-build"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium hover:opacity-90"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create First Project
                  </Link>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#161b22] transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FolderIcon className="w-5 h-5 text-[#58a6ff] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/wonder-build?projectId=${encodeURIComponent(project.id)}`}
                          className="text-[#58a6ff] font-medium hover:underline truncate block"
                        >
                          {project.name || "Untitled Project"}
                        </Link>
                        <div className="text-xs text-[#484f58] truncate">
                          {getCommitMessage(project.name, project.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-2 text-sm text-[#8b949e]">
                        <GitBranchIcon className="w-4 h-4" />
                        <span>main</span>
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-sm text-[#484f58]">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatTimeAgo(project.updatedAt || project.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/preview/${encodeURIComponent(project.id)}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white"
                          title="Preview"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={async () => {
                            setBusyId(project.id);
                            try {
                              await downloadFromExport(project.id);
                              pushToast("Project exported.", "success");
                            } catch (e: any) {
                              pushToast(e?.message ?? "Export failed", "error");
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          disabled={busyId === project.id}
                          className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white"
                          title="Export"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={busyId === project.id}
                          className="p-1.5 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-red-400"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/wonder-build?projectId=${encodeURIComponent(project.id)}`}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-[#238636] text-white hover:bg-[#2ea043] transition-colors"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Import Section */}
            {activeTab === "code" && (
              <div className="p-4 border-t border-[#21262d]">
                <ProjectImportExport onImported={load} />
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === "issues" && (
              <div className="p-8 text-center border-t border-[#21262d]">
                <FileIcon className="w-12 h-12 mx-auto text-[#484f58] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Issues</h3>
                <p className="text-[#8b949e]">Create an issue to track bugs, features, or tasks.</p>
                <Link
                  href="/support"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md bg-[#21262d] text-white text-sm hover:bg-[#30363d]"
                >
                  Contact Support
                </Link>
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === "actions" && (
              <div className="p-8 text-center border-t border-[#21262d]">
                <SettingsIcon className="w-12 h-12 mx-auto text-[#484f58] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Workflow Actions</h3>
                <p className="text-[#8b949e]">Configure automated workflows for your projects.</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Link
                    href="/dashboard/analytics"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#21262d] text-white text-sm hover:bg-[#30363d]"
                  >
                    <BarChartIcon className="w-4 h-4" />
                    View Analytics
                  </Link>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="p-4 border-t border-[#21262d]">
                <h3 className="text-sm font-semibold text-white mb-4">Workspace Settings</h3>
                <div className="space-y-2">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center justify-between p-3 rounded-md bg-[#161b22] hover:bg-[#21262d] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="w-5 h-5 text-[#8b949e]" />
                      <div>
                        <div className="text-sm font-medium text-white">General Settings</div>
                        <div className="text-xs text-[#8b949e]">Account, preferences, security</div>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/settings/cloud-storage"
                    className="flex items-center justify-between p-3 rounded-md bg-[#161b22] hover:bg-[#21262d] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UploadIcon className="w-5 h-5 text-[#8b949e]" />
                      <div>
                        <div className="text-sm font-medium text-white">Cloud Storage</div>
                        <div className="text-xs text-[#8b949e]">BYOC storage configuration</div>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/settings/byoc"
                    className="flex items-center justify-between p-3 rounded-md bg-[#161b22] hover:bg-[#21262d] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CodeIcon className="w-5 h-5 text-[#8b949e]" />
                      <div>
                        <div className="text-sm font-medium text-white">BYOC Credentials</div>
                        <div className="text-xs text-[#8b949e]">Cloud connection settings</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Ghost Links Section */}
            {activeTab === "code" && sorted.length > 0 && (
              <div className="p-4">
                <GhostLinksSection projects={sorted} pushToast={pushToast} />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-72 p-4 hidden lg:block">
            <div className="sticky top-4 space-y-4">
              {/* Stats */}
              <div className="rounded-md border border-[#21262d] overflow-hidden">
                <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d]">
                  <h3 className="text-sm font-semibold text-white">Repository Stats</h3>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded bg-[#161b22]">
                    <div className="text-xl font-bold text-white">{projects.length}</div>
                    <div className="text-xs text-[#8b949e]">Projects</div>
                  </div>
                  <div className="text-center p-2 rounded bg-[#161b22]">
                    <div className="text-xl font-bold text-white">{formatTimeAgo(projects[0]?.updatedAt)}</div>
                    <div className="text-xs text-[#8b949e]">Last Updated</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-md border border-[#21262d] overflow-hidden">
                <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d]">
                  <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
                </div>
                <div className="p-2 space-y-1">
                  <Link
                    href="/wonder-build"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 text-[#238636]" />
                    New Project
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <BarChartIcon className="w-4 h-4 text-[#58a6ff]" />
                    View Analytics
                  </Link>
                  <Link
                    href="/dashboard/projects"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <FolderIcon className="w-4 h-4 text-[#f0883e]" />
                    All Projects
                  </Link>
                  <Link
                    href="/wonder-build/playcanvas"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <CodeIcon className="w-4 h-4 text-[#a371f7]" />
                    3D Builder
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-md border border-[#21262d] overflow-hidden">
                <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d]">
                  <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                </div>
                <div className="p-3 space-y-3">
                  {sorted.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-start gap-2">
                      <FolderIcon className="w-4 h-4 text-[#58a6ff] mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/wonder-build?projectId=${encodeURIComponent(project.id)}`}
                          className="text-sm text-[#58a6ff] hover:underline truncate block"
                        >
                          {project.name || "Untitled Project"}
                        </Link>
                        <div className="text-xs text-[#484f58]">
                          {formatTimeAgo(project.updatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sorted.length === 0 && (
                    <div className="text-sm text-[#8b949e]">No recent activity</div>
                  )}
                </div>
              </div>

              {/* Workspace Links */}
              <div className="rounded-md border border-[#21262d] overflow-hidden">
                <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d]">
                  <h3 className="text-sm font-semibold text-white">Workspace</h3>
                </div>
                <div className="p-2 space-y-1">
                  <Link
                    href="/dashboard/overview"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <CodeIcon className="w-4 h-4" />
                    Overview
                  </Link>
                  <Link
                    href="/dashboard/teams"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <GitBranchIcon className="w-4 h-4" />
                    Teams
                  </Link>
                  <Link
                    href="/dashboard/agents"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    AI Agents
                  </Link>
                  <Link
                    href="/dashboard/collaboration"
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    <GitPullRequestIcon className="w-4 h-4" />
                    Collaboration
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}