"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  Bell,
  Box,
  ChevronDown,
  Code2,
  Folder,
  Home,
  LayoutTemplate,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  type?: string | null;
};

const projectTypeLabel = (value?: string | null) => {
  if (["game", "3d_scene", "playcanvas"].includes(value || "")) return "3D Experience";
  if (value === "workspace") return "IDE Project";
  return "Website";
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/public-pages/auth?redirectTo=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [loading, pathname, router, user]);

  useEffect(() => {
    setSearchValue(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/projects")
      .then(async (response) => response.ok ? response.json() : { projects: [] })
      .then((data) => {
        if (!cancelled) setProjects(Array.isArray(data.projects) ? data.projects : []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const routeProjectId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/projects\/([^/]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    return searchParams.get("projectId");
  }, [pathname, searchParams]);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === routeProjectId) || null,
    [projects, routeProjectId],
  );

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";
  const workspaceName = `${displayName}'s Workspace`;
  const isProjectRoute = pathname.startsWith("/dashboard/projects/");

  const withProject = (href: string) => {
    if (!currentProject) return href;
    const separator = href.includes("?") ? "&" : "?";
    return `${href}${separator}projectId=${encodeURIComponent(currentProject.id)}`;
  };

  const items = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard#projects", label: "Projects", icon: Folder },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: withProject("/wonder-build/builder"), label: "WonderBuild", icon: Pencil },
    { href: withProject("/wonderspace"), label: "WonderSpace IDE", icon: Code2 },
    { href: withProject("/3d-library"), label: "3D Assets", icon: Box },
    { href: withProject("/dashboard/collaboration"), label: "Team", icon: Users },
    { href: withProject("/dashboard/settings"), label: "Settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard#projects") return isProjectRoute;
    const pathOnly = href.split("?")[0].split("#")[0];
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    router.push(query ? `/dashboard?q=${encodeURIComponent(query)}#projects` : "/dashboard#projects");
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#06101c] text-sm text-white/50">Loading...</div>;
  }
  if (!user) return null;

  const activityHref = currentProject
    ? `/dashboard/projects/${encodeURIComponent(currentProject.id)}#project-activity`
    : "/dashboard#workspace-activity";

  return (
    <div className="min-h-screen bg-[#06101c] text-white">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center border-b border-white/10 bg-[#07111e]/95 px-4 backdrop-blur lg:pl-[302px]">
        <button type="button" onClick={() => setMobileOpen(true)} className="mr-3 rounded-lg p-2 hover:bg-white/5 lg:hidden" aria-label="Open navigation">
          <Menu size={20} />
        </button>

        <div className="mx-auto flex w-full max-w-[1640px] items-center justify-between gap-4">
          <form onSubmit={submitSearch} className="relative w-full max-w-[700px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              aria-label="Search projects"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search projects..."
              className="h-11 w-full rounded-lg border border-white/15 bg-[#0a1626] pl-11 pr-16 text-sm outline-none placeholder:text-white/35 focus:border-blue-500/60"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/45 hover:bg-white/5 hover:text-white">
              Enter
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/dashboard?create=project#projects" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold shadow-lg shadow-blue-950/20">
              <Plus size={16} /> <span className="hidden sm:inline">Create</span><ChevronDown size={13} className="hidden sm:block" />
            </Link>
            <Link href={activityHref} aria-label="Recent activity" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/65 hover:bg-white/5 hover:text-white">
              <Bell size={18} />
            </Link>
            <Link href={withProject("/dashboard/settings")} className="hidden items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/5 sm:flex" aria-label="Account settings">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-600 text-sm font-bold ring-1 ring-white/20">{displayName.charAt(0).toUpperCase()}</span>
              <span className="max-w-32 truncate text-sm font-semibold">{displayName}</span>
              <ChevronDown size={14} className="text-white/45" />
            </Link>
          </div>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-[60] w-[286px] border-r border-white/10 bg-[#081321] transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-12 shrink-0 place-items-center rounded-2xl bg-[radial-gradient(circle_at_65%_35%,#38bdf8,transparent_30%),linear-gradient(135deg,#7c3aed,#2563eb)] text-sm font-black shadow-lg shadow-violet-950/30">☁</span>
            <span className="min-w-0">
              <b className="block truncate text-xl tracking-tight">Dream<span className="text-fuchsia-400">Maker</span><span className="text-blue-400">Hub</span></b>
              <small className="block text-[10px] text-white/40">Build Tomorrow, Together</small>
            </span>
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded p-1 text-white/50 lg:hidden" aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="space-y-2 p-4">
          <Link href="/dashboard" className="block rounded-xl border border-white/15 bg-[#0d1a2b] p-3 hover:border-violet-500/35 hover:bg-[#101d30]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Workspace</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-600 text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><b className="block truncate text-xs">{workspaceName}</b><span className="text-[10px] text-white/40">Personal workspace</span></span>
              <ChevronDown size={13} className="text-white/40" />
            </div>
          </Link>

          {!isProjectRoute && (
            <div className="rounded-xl border border-white/10 bg-[#0b1726] p-2">
              <p className="px-2 pb-1 text-[10px] font-semibold text-white/45">Personal</p>
              <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-2 py-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-xs font-bold">{displayName.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-xs">{workspaceName}</b><span className="text-[10px] text-white/40">Personal workspace</span></span>
                <span className="text-blue-400">✓</span>
              </div>
              <p className="px-2 pb-1 pt-3 text-[10px] font-semibold text-white/45">Organization <span className="font-normal text-white/25">(Optional)</span></p>
              <p className="px-2 pb-2 text-[10px] leading-4 text-white/35">No organization workspace is connected yet.</p>
              <Link href="/dashboard/collaboration" className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65 hover:bg-white/5 hover:text-white">
                <Users size={13} /> Open team tools
              </Link>
            </div>
          )}

          {isProjectRoute && currentProject && (
            <>
              <Link href="/dashboard" className="block rounded-lg border border-white/10 px-3 py-2.5 text-xs text-blue-300 hover:bg-white/5">← Back to workspace</Link>
              <div className="rounded-xl border border-white/10 bg-[#0d1a2b] p-2">
                <p className="px-2 pb-1 text-[10px] text-white/35">Current Project</p>
                <button type="button" onClick={() => setProjectMenuOpen((open) => !open)} className="flex w-full items-center gap-2 rounded-lg bg-blue-500/10 px-2 py-2 text-left">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600/25"><Folder size={17} /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-xs">{currentProject.name}</b><span className="text-[10px] text-white/40">{projectTypeLabel(currentProject.tool || currentProject.type)}</span></span>
                  <ChevronDown size={13} className="text-white/40" />
                </button>

                {projectMenuOpen && (
                  <div className="mt-2 border-t border-white/10 pt-2">
                    {projects.slice(0, 8).map((project) => (
                      <Link key={project.id} href={`/dashboard/projects/${project.id}`} onClick={() => setProjectMenuOpen(false)} className={`block rounded-lg px-2 py-2 text-xs ${project.id === currentProject.id ? "bg-violet-500/15 text-violet-200" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                        {project.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <nav className="px-3 pb-28">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={`${label}-${href}`}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive(href) ? "bg-blue-600/25 text-white shadow-[inset_3px_0_0_#a855f7]" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4 overflow-hidden rounded-xl border border-violet-500/30 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,.55),transparent_35%),linear-gradient(135deg,#1e1b4b,#0b1630)] p-4">
          <p className="text-xs font-bold">Turn your ideas into amazing things.</p>
          <p className="mt-1 text-[10px] text-white/45">Create. Build. Share. Together.</p>
        </div>
      </aside>

      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[55] bg-black/60 lg:hidden" />}

      <main className="min-h-screen pt-[72px] lg:pl-[286px]">
        <div className="mx-auto max-w-[1640px] p-4 sm:p-5 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
