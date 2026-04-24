"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@lib/supabase/auth-context";
import { 
  LayoutDashboard, 
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
  ChevronDown
} from "lucide-react";

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type MenuItem = {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [announce, setAnnounce] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["management"]);

  const mainItems: SidebarItem[] = [
    { href: "/dashboard", label: "Actions", icon: LayoutDashboard },
    { href: "/wonder-build", label: "Wonderbuild", icon: Pencil },
    { href: "/wonderspace/ide", label: "WonderSpace IDE", icon: Code2 },
    { href: "/wonder-build/playcanvas", label: "Wonderplay", icon: Play },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const managementItems: MenuItem[] = [
    {
      label: "Management",
      items: [
        { href: "/dashboard/collaboration", label: "Teams", icon: Users },
        { href: "/settings/billing", label: "Billing", icon: CreditCard },
        { href: "/settings/organization", label: "Enterprise", icon: Building2 },
        { href: "/support", label: "Support", icon: HelpCircle },
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
        <div className="flex items-center px-4 py-4 border-b border-white/10">
          <Link href="/dashboard" className="font-bold text-lg">WonderSpace</Link>
        </div>

        <nav className="p-2">
          {/* Main items */}
          <div className="mb-4">
            {mainItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                  isActive(item.href) 
                    ? "bg-white/10 text-white border-l-2 border-orange-500" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={16} />
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
                    <item.icon size={16} />
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