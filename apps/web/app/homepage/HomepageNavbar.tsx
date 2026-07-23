'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { type NavMenuItem, menuItems } from "./data";

export default function HomepageNavbar({ scrolled }: { scrolled: boolean }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-black/70 backdrop-blur-xl shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href={isAuthenticated ? "/dashboard/projects" : "/"} className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-tight text-white">Wonderland</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 text-xs text-purple-300/60">
            <span className="text-sm">🔮</span>
            <span>Spirit Guide</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto md:w-80 md:left-auto md:right-6 md:top-14 md:rounded-b-2xl md:border-t-0 md:border-l md:border-r md:border-b-0">
          <div className="p-6 flex flex-col gap-6">
            {menuItems.map((menu: NavMenuItem) => (
              <div key={menu.title} className="flex flex-col gap-2">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === menu.title ? null : menu.title)}
                  className="flex items-center justify-between w-full text-left text-white font-semibold text-lg"
                >
                  {menu.title}
                  <ChevronDown size={20} className={expandedCategory === menu.title ? "rotate-180 transition-transform" : ""} />
                </button>
                {expandedCategory === menu.title && (
                  <div className="flex flex-col gap-3 pl-4 border-l border-white/10">
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="text-white/60 hover:text-white text-sm transition-colors"
                      >
                        {item.icon} {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
              {authLoading ? (
                <div className="h-10 w-full animate-pulse rounded-full bg-white/10" />
              ) : isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Dashboard →
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 transition hover:text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/public-pages/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/public-pages/auth?signup=true"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
