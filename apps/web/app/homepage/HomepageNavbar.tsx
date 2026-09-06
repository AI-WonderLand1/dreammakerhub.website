'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href={isAuthenticated ? "/dashboard/projects" : "/"} className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-tight text-white">Wonderland</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated && !authLoading && (
            <Link
              href="/dashboard/projects"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 top-full max-h-[calc(100vh-3.5rem)] w-full overflow-y-auto border-b border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl md:left-auto md:right-6 md:top-14 md:w-80 md:rounded-b-2xl md:border-x md:border-b">
          <div className="flex flex-col gap-3 p-5">
            {menuItems.map((menu: NavMenuItem) => {
              const expanded = expandedCategory === menu.title;
              return (
                <div key={menu.title} className="overflow-hidden rounded-xl border border-transparent">
                  <button
                    onClick={() => setExpandedCategory(expanded ? null : menu.title)}
                    className={`flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left font-semibold transition ${
                      expanded ? "bg-white/[.05] text-white" : "text-white/90 hover:bg-white/[.035]"
                    }`}
                    aria-expanded={expanded}
                  >
                    <span className="text-[17px]">{menu.title}</span>
                    <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="ml-3 mt-1 flex flex-col gap-1.5 border-l border-white/10 pl-3 pb-1">
                      {menu.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="rounded-lg px-2 py-2 text-sm text-white/60 transition hover:bg-white/[.04] hover:text-white"
                        >
                          <span className="mr-2" aria-hidden="true">{item.icon}</span>
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-2 border-t border-white/10 pt-4">
              {authLoading ? (
                <div className="h-11 w-full animate-pulse rounded-xl bg-white/10" />
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5">
                    <UserRound size={16} className="shrink-0 text-purple-300" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/35">Signed in</div>
                      <div className="truncate text-xs font-medium text-white/75">{user?.email || 'AI Wonderland account'}</div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button
                    onClick={() => { void handleSignOut(); setIsMenuOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-sm text-white/55 transition hover:bg-white/[.07] hover:text-white"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    href="/public-pages/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/public-pages/auth?signup=true"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
