"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CloudUpload, GitPullRequest, Plus, Save, Search, Settings, User } from "lucide-react";
import toast, { Toaster } from "@components/ui/toast";

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

type TabId = "projects" | "settings" | "profile";

type BusyAction = "push" | "pull" | "commit" | null;

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-9 px-3 rounded-lg border text-xs font-bold tracking-wide transition inline-flex items-center gap-2",
        active
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SmallBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/80 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-black text-white hover:shadow-lg hover:shadow-purple-500/20"
    >
      {children}
    </button>
  );
}

async function parseResult(res: Response) {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);
  return payload;
}

export default function DashboardRepoView() {
  const [tab, setTab] = useState<TabId>("projects");
  const [q, setQ] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  const projects: Array<{ id: string; name: string; updated: string }> = useMemo(() => [], []);

  const selectedProjectId = projects[0]?.id;

  const runGitAction = async (action: Exclude<BusyAction, null>) => {
    if (!selectedProjectId && action !== "pull") {
      toast.error("No project selected. Create or load a project first.");
      return;
    }

    setBusyAction(action);
    const toastId = toast.loading(`${action[0].toUpperCase()}${action.slice(1)} in progress…`);

    try {
      if (action === "push") {
        await parseResult(
          await fetch(`/api/projects/${encodeURIComponent(selectedProjectId as string)}/publish`, { method: "POST" })
        );
      } else if (action === "commit") {
        await parseResult(
          await fetch(`/api/projects/${encodeURIComponent(selectedProjectId as string)}/snapshots`, { method: "POST" })
        );
      } else {
        await parseResult(await fetch("/api/wonder-sync/pull", { method: "POST" }));
      }

      toast.success(`${action[0].toUpperCase()}${action.slice(1)} complete.`, { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || `${action} failed`, { id: toastId });
    } finally {
      setBusyAction(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(s));
  }, [projects, q]);

  return (
    <div className="w-full">
      <Toaster />
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-tight">Dashboard</div>
            <div className="text-sm text-white/50 mt-1">Create a project or open an existing one.</div>
          </div>

          <div className="flex items-center gap-2 md:justify-end">
            <Link
              href="/wonder-build"
              className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/80 inline-flex items-center"
            >
              Open Builder
            </Link>

            <SmallBtn onClick={() => runGitAction("pull")} disabled={busyAction !== null}>
              <span className="inline-flex items-center gap-1"><GitPullRequest className="w-4 h-4" /> {busyAction === "pull" ? "Pulling…" : "Pull"}</span>
            </SmallBtn>
            <SmallBtn onClick={() => runGitAction("commit")} disabled={busyAction !== null}>
              <span className="inline-flex items-center gap-1"><Save className="w-4 h-4" /> {busyAction === "commit" ? "Committing…" : "Commit"}</span>
            </SmallBtn>
            <SmallBtn onClick={() => runGitAction("push")} disabled={busyAction !== null}>
              <span className="inline-flex items-center gap-1"><CloudUpload className="w-4 h-4" /> {busyAction === "push" ? "Pushing…" : "Push"}</span>
            </SmallBtn>

            <PrimaryBtn onClick={() => toast("New project flow coming next (Supabase projects table).")}>
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Project
              </span>
            </PrimaryBtn>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TabButton active={tab === "projects"} onClick={() => setTab("projects")} label="Projects" />
            <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings className="w-4 h-4" />} label="Settings" />
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<User className="w-4 h-4" />} label="Profile" />
          </div>

          {tab === "projects" && (
            <div className="flex items-center gap-2 lg:justify-end">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search projects…"
                  className="h-9 w-full lg:w-80 pl-9 pr-3 rounded-lg bg-[#0b1220] border border-white/10 text-sm text-white/90 outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        {tab === "projects" && (
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="text-xs text-white/60">Your Projects</div>
              <div className="text-xs text-white/40">{projects.length ? `${projects.length} total` : "0 total"}</div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="text-base font-bold text-white">No projects yet</div>
                <div className="text-sm text-white/50 mt-2 max-w-xl mx-auto">
                  Create your first project to start building. Once projects exist, this page will list them here.
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <PrimaryBtn onClick={() => toast("New project flow coming next (Supabase projects table).")}>
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create Project
                    </span>
                  </PrimaryBtn>

                  <Link
                    href="/wonder-build"
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/80 inline-flex items-center"
                  >
                    Go to Builder
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredProjects.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-[11px] text-white/40 truncate">Updated {p.updated}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <SmallBtn onClick={() => toast(`Open project ${p.id} (todo)`)}>Open</SmallBtn>
                      <SmallBtn onClick={() => toast(`Edit project settings ${p.id} (todo)`)}>Settings</SmallBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
              <div className="text-[11px] text-white/40">Next: load real projects from Supabase instead of placeholders.</div>
              <div className="flex items-center gap-2">
                <SmallBtn onClick={() => toast("Import later")}>Import</SmallBtn>
                <SmallBtn onClick={() => toast("Templates later")}>Templates</SmallBtn>
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-black mb-2">Settings</div>
            <div className="text-sm text-white/60">This page should show user settings + project settings. We’ll wire real pages next.</div>
          </div>
        )}

        {tab === "profile" && (
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-black mb-2">Profile</div>
            <div className="text-sm text-white/60">This is where users can add keys/secrets for their projects (we’ll build this next).</div>
          </div>
        )}
      </div>
    </div>
  );
}
