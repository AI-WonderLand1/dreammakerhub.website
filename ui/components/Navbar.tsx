"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@lib/supabase/auth-context";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isAppPath = useMemo(() => {
    if (!pathname) return false;
    return [
      "/dashboard",
      "/subscription",
      "/settings",
      "/wonderspace",
      "/wonder-build",
      "/workspace",
    ].some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  const menuItems = [
    {
      title: "Products",
      items: [
        { name: "WonderSpace IDE", href: "/wonderspace", icon: "💻" },
        { name: "Wonder-Build", href: "/wonder-build", icon: "⚡" },
        { name: "Wonder Playground", href: "/playground", icon: "🎮" },
        { name: "AI Modules", href: "/apps/ai-modules", icon: "🤖" },
      ]
    },
    {
      title: "Solutions",
      items: [
        { name: "For Developers", href: "/solutions/developers", icon: "👨‍💻" },
        { name: "For Designers", href: "/solutions/designers", icon: "🎨" },
        { name: "For Teams", href: "/solutions/teams", icon: "👥" }
      ]
    },
    {
      title: "Resources",
      items: [
        { name: "Documentation", href: "/docs", icon: "📚" },
        { name: "API Reference", href: "/api-reference", icon: "📖" },
        { name: "Tutorials", href: "/tutorials", icon: "🎓" },
        { name: "Blog", href: "/blog", icon: "📝" }
      ]
    },
    {
      title: "Company",
      items: [
        { name: "About Us", href: "/about", icon: "ℹ️" },
        { name: "Careers", href: "/careers", icon: "💼" },
        { name: "Contact", href: "/contact", icon: "📧" },
        { name: "Privacy Policy", href: "/privacy", icon: "🔒" }
      ]
    }
  ];

  const dashboardLinks = [
    { name: "Projects", href: "/dashboard/projects" },
    { name: "Subscription", href: "/subscription" },
    { name: "Settings", href: "/settings" },
  ];

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const showPublicNav = !isAppPath;
  const showDashboardNav = Boolean(user);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img src="/images/ai-wonderland-logo.svg" alt="AI-WONDERLAND" className="w-10 h-10 rounded-md" />
              <span className="text-xl font-bold text-white">AI-WONDERLAND</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {showPublicNav && (
                <>
                  {menuItems.map((menu) => (
                    <div key={menu.title} className="relative group">
                      <button className="flex items-center space-x-1 text-white/80 hover:text-white transition py-2">
                        <span>{menu.title}</span>
                        <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
                      </button>

                      {/* Dropdown */}
                      <div className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2">
                          {menu.items.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition"
                            >
                              <span className="text-2xl">{item.icon}</span>
                              <span>{item.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {showDashboardNav && (
                <div className="flex items-center space-x-4">
                  {dashboardLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-white/80 hover:text-white transition"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}

              {user ? (
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-lg font-semibold text-white"
                >
                  Logout
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/public-pages/auth"
                    className="px-4 py-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-lg font-semibold text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/public-pages/auth?signup=true"
                    className="px-4 py-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-lg font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <ChevronDown size={28} className={mobileMenuOpen ? "rotate-180" : ""} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-4">
            {showPublicNav && (
              <>
                {menuItems.map((menu) => (
                  <div key={menu.title}>
                    <button
                      onClick={() => toggleMenu(menu.title)}
                      className="flex items-center justify-between w-full text-white/80 hover:text-white py-2"
                    >
                      <span>{menu.title}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${expandedMenus[menu.title] ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expandedMenus[menu.title] && (
                      <div className="pl-4 space-y-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-3 px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition"
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {showDashboardNav && (
              <div className="space-y-2 pt-2">
                <div className="text-white/60 text-sm uppercase tracking-wide">Dashboard</div>
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}

            {/* 🔥 Mobile Auth Buttons */}
            {user ? (
              <button
                onClick={signOut}
                className="w-full px-4 py-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-lg font-semibold text-white"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/public-pages/auth"
                  className="block w-full text-center px-4 py-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-lg font-semibold text-white"
                >
                  Login
                </Link>
                <Link
                  href="/public-pages/auth?signup=true"
                  className="block w-full text-center px-4 py-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-lg font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
