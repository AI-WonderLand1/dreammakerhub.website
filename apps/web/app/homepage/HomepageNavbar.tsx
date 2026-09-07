'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

const PRIMARY_LINKS = [
  { label: "Build", href: "/wonder-build" },
  { label: "Code", href: "/wonderspace" },
  { label: "3D", href: "/dashboard/3dhub" },
  { label: "Docs", href: "/docs" },
] as const;

export default function HomepageNavbar({ scrolled }: { scrolled: boolean }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-black/80 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "bg-black/20 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
          <span className="text-base font-black tracking-tight text-white">AI Wonderland</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {PRIMARY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!authLoading && isAuthenticated ? (
            <Link
              href="/dashboard/projects"
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <LayoutDashboard size={15} /> Projects
            </Link>
          ) : !authLoading ? (
            <Link
              href="/public-pages/auth"
              className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex"
            >
              Sign In
            </Link>
          ) : null}

          {!authLoading && !isAuthenticated && (
            <Link
              href="/public-pages/auth?signup=true"
              className="hidden rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 sm:inline-flex"
            >
              Start Free
            </Link>
          )}

          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-white/10 bg-black/95 px-5 py-5 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 border-t border-white/10 pt-4">
              {authLoading ? (
                <div className="h-11 w-full animate-pulse rounded-xl bg-white/10" />
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                    <UserRound size={16} className="shrink-0 text-violet-300" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/35">Signed in</div>
                      <div className="truncate text-xs font-medium text-white/75">{user?.email || "AI Wonderland account"}</div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
                  >
                    <LayoutDashboard size={16} /> Open Projects
                  </Link>
                  <button
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-sm text-white/55 transition hover:bg-white/[.07] hover:text-white"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/public-pages/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/public-pages/auth?signup=true"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-black"
                  >
                    Start Free
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
