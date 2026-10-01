"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import WonderSpaceProjectNavigation from "@/components/dashboard/WonderSpaceProjectNavigation";
import {
  Bell,
  BookOpen,
  Bot,
  Box,
  CreditCard,
  ChevronDown,
  CircleHelp,
  Code2,
  Folder,
  Home,
  LayoutTemplate,
  Library,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
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
  if (["game", "3d", "3d_scene", "playcanvas"].includes(value || "")) return "3D Experience";
  if (["workspace", "code"].includes(value || "")) return "Code / Files";
  if (value === "npc") return "NPC AI";
  if (["ai", "ai_app", "playground"].includes(value || "")) return "AI App";
  return "Website";
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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
    fetchAuthenticatedProject("/api/projects")
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

  type SiteMenuItem = {
    href: string;
    label: string;
    icon: typeof Home;
    external?: boolean;
  };

  type SiteMenuGroup = {
    label: string;
    icon: typeof Home;
    items: SiteMenuItem[];
  };

  // Site-wide hamburger navigation. Every destination is grouped under a
  // submenu so users can stay in one shell and drill into the exact tool.
  const menuGroups: SiteMenuGroup[] = [
    {
      label: "Quick access",
      icon: Home,
      items: [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/community", label: "Feed", icon: Users },
        { href: "/dashboard#projects", label: "All Projects", icon: Folder },
        {
          href: currentProject
            ? `/dashboard/projects/${encodeURIComponent(currentProject.id)}/issues`
            : "/dashboard#projects",
          label: currentProject ? "Project Issues" : "Issues",
          icon: CircleHelp,
        },
        {
          href: currentProject
            ? `/dashboard/projects/${encodeURIComponent(currentProject.id)}/discussions`
            : "/community",
          label: currentProject ? "Project Discussions" : "Discussions",
          icon: Users,
        },
        {
          href: currentProject
            ? `/dashboard/projects/${encodeURIComponent(currentProject.id)}/files`
            : "/dashboard#projects",
          label: "Files & Code",
          icon: Code2,
        },
        { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
        { href: "/dashboard/settings/simplerick", label: "SimpleRickSettings", icon: Sparkles },
      ],
    },
    {
      label: "Home",
      icon: Home,
      items: [
        { href: "/dashboard", label: "Workspace Home", icon: Home },
        { href: "/community", label: "Community", icon: Users },
        { href: "/blog", label: "Blog", icon: BookOpen },
      ],
    },
    {
      label: "Projects",
      icon: Folder,
      items: [
        { href: "/dashboard#projects", label: "All Projects", icon: Folder },
        { href: "/dashboard?create=project#projects", label: "Create Project", icon: Plus },
        { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
      ],
    },
    {
      label: "Build",
      icon: Pencil,
      items: [
        { href: "/wonder-build", label: "Start / Templates", icon: LayoutTemplate },
        { href: withProject("/wonder-build/builder"), label: "Visual Builder", icon: Pencil },
        { href: "/wonder-build/templates", label: "Template Library", icon: LayoutTemplate },
      ],
    },
    {
      label: "Code",
      icon: Code2,
      items: [
        { href: withProject("/dashboard?workspaceTab=code"), label: "Project Code", icon: Code2 },
        { href: withProject("/dashboard/agents"), label: "AI Coding Agents", icon: Bot },
      ],
    },
    {
      label: "3D",
      icon: Box,
      items: [
        { href: withProject("/dashboard/3dhub"), label: "3D Studio", icon: Box },
        { href: withProject("/dashboard/ai-generator"), label: "3D AI Generator", icon: Sparkles },
        { href: withProject("/3d-library"), label: "3D Asset Library", icon: Library },
        { href: withProject("/dashboard/npc"), label: "My NPCs", icon: Bot },
        { href: withProject("/wonder-play"), label: "NPC-AI-SIM", icon: Bot },
      ],
    },
    {
      label: "AI",
      icon: Sparkles,
      items: [
        { href: "https://playground.dreammakerhub.website/", label: "AI Playground", icon: Sparkles, external: true },
        { href: withProject("/dashboard/agents"), label: "AI Agents", icon: Bot },
        { href: "/ai-modules", label: "AI Modules", icon: Library },
      ],
    },
    {
      label: "Libraries",
      icon: Library,
      items: [
        { href: "/wonder-build/templates", label: "Template Library", icon: LayoutTemplate },
        { href: withProject("/library"), label: "Asset Library", icon: Folder },
        { href: withProject("/3d-library"), label: "3D Asset Library", icon: Box },
        { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
      ],
    },
    {
      label: "Team",
      icon: Users,
      items: [
        { href: withProject("/dashboard/collaboration"), label: "Collaboration", icon: Users },
        { href: currentProject ? `/dashboard/projects/${encodeURIComponent(currentProject.id)}/discussions` : "/community", label: "Discussions", icon: Users },
      ],
    },
    {
      label: "Docs",
      icon: BookOpen,
      items: [
        { href: "/docs", label: "Documentation", icon: BookOpen },
        { href: "/tutorials", label: "Tutorials", icon: BookOpen },
        { href: "/api-reference", label: "API Reference", icon: Code2 },
      ],
    },
    {
      label: "Support",
      icon: CircleHelp,
      items: [
        { href: "/support", label: "Support", icon: CircleHelp },
        { href: "/community", label: "Community", icon: Users },
        { href: "/status", label: "Service Status", icon: Bell },
      ],
    },
    {
      label: "Settings",
      icon: Settings,
      items: [
        { href: withProject("/dashboard/settings"), label: "Workspace Settings", icon: Settings },
        { href: "/dashboard/usage", label: "Usage & Limits", icon: Settings },
        { href: "/dashboard/subscription", label: "Subscription", icon: Settings },
        { href: "/dashboard/settings/account", label: "Account", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href.startsWith("/dashboard?create=project")) {
      return pathname === "/dashboard" && searchParams.get("create") === "project";
    }
    if (href === "/dashboard") return pathname === "/dashboard" && !["code", "history", "tools"].includes(searchParams.get("workspaceTab") || "") && searchParams.get("create") !== "project";
    if (href.startsWith("/dashboard?workspaceTab=code")) return pathname === "/dashboard" && searchParams.get("workspaceTab") === "code";
    if (href === "/dashboard#projects") return isProjectRoute;
    if (/^https?:\/\//.test(href)) return false;
    const pathOnly = href.split("?")[0].split("#")[0];
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    router.push(query ? `/dashboard?q=${encodeURIComponent(query)}#projects` : "/dashboard#projects");
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setAccountMenuOpen(false);
      setSigningOut(false);
    }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#06101c] text-sm text-white/50">Loading...</div>;
  }
  if (!user) return null;

  const activityHref = currentProject
    ? `/dashboard/projects/${encodeURIComponent(currentProject.id)}#project-activity`
    : "/dashboard#projects";

  const toggleGroup = (label: string, open: boolean) => {
    setExpandedGroups((current) => ({ ...current, [label]: !open }));
  };

  const renderSubLink = ({ href, label, icon: Icon, external }: SiteMenuItem) => {
    const classes = `mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${isActive(href) ? "bg-violet-500/15 text-violet-200" : "text-white/55 hover:bg-white/5 hover:text-white"}`;
    if (external) {
      return (
        <a
          key={`${label}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className={classes}
        >
          <Icon size={15} /> {label}
        </a>
      );
    }
    return (
      <Link
        key={`${label}-${href}`}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={classes}
      >
        <Icon size={15} /> {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#06101c] text-white">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center border-b border-white/10 bg-[#07111e]/95 px-4 backdrop-blur">
        <button type="button" onClick={() => setMobileOpen(true)} className="mr-3 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 hover:bg-white/5" aria-label="Open site navigation">
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="mr-4 hidden shrink-0 items-center gap-2 md:flex">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[radial-gradient(circle_at_65%_35%,#38bdf8,transparent_30%),linear-gradient(135deg,#7c3aed,#2563eb)] text-xs font-black">◇</span>
          <b className="text-base tracking-tight">AI <span className="text-fuchsia-400">WONDER</span><span className="text-blue-400">LAND</span></b>
        </Link>

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
            <Link href={activityHref} aria-label={currentProject ? "Project activity" : "View projects"} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/65 hover:bg-white/5 hover:text-white">
              <Bell size={18} />
            </Link>
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/5"
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-600 text-sm font-bold ring-1 ring-white/20">{displayName.charAt(0).toUpperCase()}</span>
                <span className="max-w-32 truncate text-sm font-semibold">{displayName}</span>
                <ChevronDown size={14} className={`text-white/45 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-12 z-[70] w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#070d17] p-2 shadow-2xl">
                  <div className="mb-2 flex items-center gap-3 border-b border-white/10 px-3 pb-3 pt-2">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-600 text-sm font-bold ring-1 ring-white/20">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-xs text-white/40">{user.email || "Signed-in account"}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link href="/dashboard/settings/account" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                      <User size={16} /> Profile
                    </Link>
                    <Link href="/dashboard#projects" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                      <Folder size={16} /> Projects
                    </Link>
                  </div>

                  <div className="my-2 border-t border-white/10" />

                  <div className="space-y-1">
                    <Link href={withProject("/dashboard/settings")} onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                      <Settings size={16} /> Settings
                    </Link>
                    <Link href="/dashboard/settings/simplerick" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                      <Sparkles size={16} /> SimpleRickSettings
                    </Link>
                    <Link href="/dashboard/usage" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                      <CreditCard size={16} /> Billing & usage
                    </Link>
                    <Link href="/subscription" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                      <Sparkles size={16} /> Upgrade
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={signingOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[.025] px-3 py-2.5 text-left text-sm text-white/75 hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    <LogOut size={16} /> {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-[60] flex w-[300px] max-w-[92vw] flex-col overflow-hidden border-r border-white/10 bg-[#081321] shadow-2xl transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-12 shrink-0 place-items-center rounded-2xl bg-[radial-gradient(circle_at_65%_35%,#38bdf8,transparent_30%),linear-gradient(135deg,#7c3aed,#2563eb)] text-sm font-black shadow-lg shadow-violet-950/30">☁</span>
            <span className="min-w-0">
              <b className="block truncate text-xl tracking-tight">AI <span className="text-fuchsia-400">WONDER</span><span className="text-blue-400">LAND</span></b>
              <small className="block text-[10px] text-white/40">Build Tomorrow, Together</small>
            </span>
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded p-1 text-white/50 hover:bg-white/5 hover:text-white" aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-2 p-4">
            <Link href="/dashboard" className="block rounded-xl border border-white/15 bg-[#0d1a2b] p-3 hover:border-violet-500/35 hover:bg-[#101d30]">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Workspace</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-600 text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-xs">{workspaceName}</b><span className="text-[10px] text-white/40">Personal workspace</span></span>
                <ChevronDown size={13} className="text-white/40" />
              </div>
            </Link>

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

          <nav className="px-3 pb-3" aria-label="AI WONDERLAND site navigation">
            {menuGroups.map((group) => {
              const Icon = group.icon;
              const groupActive = group.items.some((item) => isActive(item.href));
              const open = expandedGroups[group.label] ?? groupActive;
              return (
                <div key={group.label} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label, open)}
                    aria-expanded={open}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${groupActive ? "bg-blue-600/15 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left font-medium">{group.label}</span>
                    <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="ml-4 mt-1 border-l border-white/10 pl-2">
                      {group.items.map(renderSubLink)}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-violet-500/30 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,.55),transparent_35%),linear-gradient(135deg,#1e1b4b,#0b1630)] p-4">
            <p className="text-xs font-bold">Turn your ideas into amazing things.</p>
            <p className="mt-1 text-[10px] text-white/45">Create. Build. Share. Together.</p>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="mx-4 mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            <LogOut size={16} /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[55] bg-black/65" />}

      <main className="min-h-screen pt-[72px]">
        <div className="mx-auto max-w-[1640px] p-4 sm:p-5 lg:p-6">
          {currentProject && pathname !== "/dashboard" && !isProjectRoute && (
            <div className="mb-5">
              <WonderSpaceProjectNavigation projectId={currentProject.id} />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
