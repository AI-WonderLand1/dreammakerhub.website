"use client";

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { createClient } from "@/lib/supabase/client";
import AetherGuardDialog from "@/components/AetherGuardDialog";
import { logger } from '@/lib/logger';
import { 
  LayoutDashboard, 
  FolderOpen,
  LayoutTemplate,
  Folder,
  Pencil, 
  Code2, 
  Play, 
  Settings,
  Users,
  Building2,
  CreditCard,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Check,
  BarChart3,
  Search,
  Mic,
  MicOff,
  MessageCircle,
  Bug,
  Bot,
  Database,
  Shield,
  Sparkles,
  Palette,
  Terminal,
} from "lucide-react";

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

type MenuItem = {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
};

type Project = {
  id: string;
  name: string;
  type: string;
};

  const PROJECT_TYPE_INFO: Record<string, { editor: string; label: string }> = {
    wonderbuild: { editor: "/wonder-build/builder", label: "Wonderbuild" },
    game: { editor: "/dashboard/3dhub", label: "WonderPlay 3D" },
    "3d_scene": { editor: "/dashboard/3dhub", label: "WonderPlay 3D" },
    web_app: { editor: "/wonder-build/builder", label: "Wonderbuild" },
    workspace: { editor: "/ide", label: "IDE" },
  };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [announce, setAnnounce] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["management"]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const sidebarGroups: SidebarGroup[] = [
    {
      label: "Build",
      items: [
        { href: "/wonder-build", label: "WonderBuild", icon: Pencil },
        { href: "/wonder-build/builder", label: "Visual Builder", icon: Palette },
      ],
    },
    {
      label: "Code",
      items: [
        { href: "/wonderspace", label: "WonderSpace", icon: Code2 },
        { href: "/ide", label: "Cloud IDE", icon: Terminal },
        { href: "https://playground.dreammakerhub.website/", label: "AI Playground", icon: Bot },
      ],
    },
    {
      label: "3D",
      items: [
        { href: "/dashboard/3dhub", label: "WonderPlay 3D", icon: Play },
      ],
    },
  ];

  const secondaryItems: SidebarItem[] = [
    { href: "/dashboard", label: "Files & Folders", icon: FolderOpen },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/dashboard/projects", label: "Projects", icon: Folder },
    { href: "/library", label: "My Scenes", icon: Database },
    { href: "/dashboard/agents", label: "Agents", icon: Bot },
    { href: "/dashboard/aetherguard", label: "AetherGuard", icon: Shield },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const managementItems: MenuItem[] = [
    {
      label: "Management",
      items: [
        { href: "/dashboard/usage", label: "Usage & Billing", icon: BarChart3 },
        { href: "/dashboard/collaboration", label: "Teams", icon: Users },
        { href: "/dashboard/settings/byoc", label: "Storage", icon: Database },
        { href: "/settings/security", label: "Security", icon: Shield },
        { href: "/support", label: "Feedback", icon: MessageCircle },
      ]
    }
  ];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/public-pages/auth?redirectTo=${encodeURIComponent(pathname || "/dashboard")}`);
      return;
    }
    setAnnounce("Dashboard loaded.");
  }, [loading, pathname, router, user]);

  // Load projects and set current project
  useEffect(() => {
    const loadProjects = async () => {
      const supabase = createClient();
      if (!supabase || !user) {
        setLoadingProjects(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("projects")
          .select("id, name, type")
          .eq("owner_id", user.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(20);

        if (data) {
          setProjects(data);
          const projectId = searchParams.get("projectId");
          const current = data.find(p => p.id === projectId) || data[0];
          if (current) setCurrentProject(current);
        }
      } catch (err) {
        logger.error("Failed to load projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [user, searchParams]);

  const handleSwitchProject = (project: Project) => {
    setCurrentProject(project);
    setProjectMenuOpen(false);
    const typeInfo = PROJECT_TYPE_INFO[project.type] || PROJECT_TYPE_INFO["wonderbuild"];
    router.push(`${typeInfo.editor}?projectId=${project.id}`);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117] text-white">
        <p className="text-sm text-white/75">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d1117]">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-bold text-sm">WonderSpace</span>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#0d1117] border-r border-white/10 z-50 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'} lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : ''}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <Link href="/dashboard" className="font-bold text-lg">WonderSpace</Link>
          
          {/* Project Switcher */}
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/70 hover:text-white hover:bg-white/10"
          >
            {currentProject?.name || "Select"}
            <ChevronDown size={12} className={`transform transition-transform ${projectMenuOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Project Switcher Dropdown */}
        {projectMenuOpen && (
          <div className="px-2 py-2 border-b border-white/10">
            <div className="text-xs text-white/40 px-2 py-1">Switch Project</div>
            {loadingProjects ? (
              <div className="px-2 py-2 text-xs text-white/40">Loading...</div>
            ) : projects.length === 0 ? (
              <Link href="/dashboard/projects" className="block px-2 py-2 text-xs text-blue-400">Create a project</Link>
            ) : (
              projects.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSwitchProject(p)}
                  className={`flex items-center justify-between w-full px-2 py-2 rounded text-xs text-left ${
                    currentProject?.id === p.id 
                      ? "bg-white/10 text-white" 
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{p.name}</span>
                  {currentProject?.id === p.id && <Check size={12} />}
                </button>
              ))
            )}
            <Link href="/dashboard/projects" className="block px-2 py-2 text-xs text-white/40 hover:text-white">
              View all projects →
            </Link>
          </div>
        )}

        <nav className="p-2">
          {/* Primary destinations: Build / Code / 3D */}
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                {group.label}
              </p>
              {group.items.map((item) =>
                item.href.startsWith("http") ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <item.icon size="16" />
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                      isActive(item.href)
                        ? "bg-white/10 text-white border-l-2 border-orange-500"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size="16" />
                    {item.label}
                  </Link>
                )
              )}
            </div>
          ))}

          {/* Workspace utilities */}
          <div className="border-t border-white/10 pt-1 mb-3">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">Workspace</p>
            {secondaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                  isActive(item.href)
                    ? "bg-white/10 text-white border-l-2 border-orange-500"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size="16" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Management dropdown */}
          <div className="border-t border-white/10 pt-2">
            <button 
              onClick={() => toggleMenu("management")}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider"
            >
              Management
              <ChevronDown size={12} className={`transform transition-transform ${expandedMenus.includes("management") ? "rotate-180" : ""}`} />
            </button>
            {expandedMenus.includes("management") && managementItems.map((menu) => (
              <div key={menu.label} className="ml-2">
                {menu.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                      isActive(item.href) 
                        ? "bg-white/10 text-white border-l-2 border-blue-500" 
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size="16" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className={`lg:ml-64 min-h-screen ${mobileMenuOpen ? 'ml-0' : ''}`}>
        {/* Top bar with search */}
        <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0d1117]/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 max-w-md">
              <div className="relative flex items-center gap-2">
                <Search className="absolute left-3 text-white/40" size="16" />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="w-full h-9 pl-9 pr-20 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/30"
                />
                <VoiceSearchButton />
              </div>
            </div>
            <AetherGuardDialog />
            <Link href="/subscription" className="hidden sm:block ml-2 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600">
              Upgrade
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}
    </div>
  );
}

function VoiceSearchButton() {
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search requires Chrome or Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) {
        const lower = final.toLowerCase();
        if (lower.includes("wonderbuild")) router.push("/wonder-build");
        else if (lower.includes("3d") || lower.includes("studio")) router.push("/dashboard/3dhub");
        else if (lower.includes("wonderplay") || lower.includes("playcanvas")) router.push("/wonder-build/playcanvas");
        else if (lower.includes("project")) router.push("/dashboard/projects");
        else if (lower.includes("ide") || lower.includes("code")) router.push("/wonderspace/ide");
        else if (lower.includes("setting")) router.push("/settings");
        else if (lower.includes("usage") || lower.includes("token")) router.push("/dashboard/usage");
        else alert(`Voice command "${final}" not recognized. Try "wonderbuild", "wonderplay", "projects", or "settings".`);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [router]);

  return (
    <button
      type="button"
      onClick={isListening ? () => {} : startListening}
      className={`absolute right-1.5 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
        isListening ? "bg-red-500 animate-pulse" : "bg-white/10 hover:bg-white/20"
      }`}
      title={isListening ? "Listening..." : "Voice search"}
    >
      {isListening ? <MicOff size={14} className="text-white" /> : <Mic size={14} className="text-white/70" />}
    </button>
  );
}