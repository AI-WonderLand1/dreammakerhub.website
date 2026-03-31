"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@lib/supabase/auth-context";
import { TopNav } from "@/app/components/navigation/TopNav";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { PageHeader } from "@/app/components/layout/PageHeader";

type NavItem = {
  href: string;
  label: string;
  ariaLabel?: string;
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [announce, setAnnounce] = useState<string>("");

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", ariaLabel: "Go to dashboard" },
      { href: "/wonder-build", label: "Builder", ariaLabel: "Open visual builder" },
      { href: "/wonder-build/puck", label: "Puck", ariaLabel: "Open Puck editor" },
      { href: "/wonder-build/playcanvas", label: "PlayCanvas Studio", ariaLabel: "Open PlayCanvas Studio builder" },
      { href: "/ai-modules", label: "AI", ariaLabel: "Open AI modules" },
      { href: "/dashboard/agents", label: "Agents", ariaLabel: "Open AI, agents, and worker options" },
      { href: "/dashboard/collaboration", label: "Collaboration", ariaLabel: "Open collaboration" },
      { href: "/dashboard/editor-playcanvas", label: "PlayCanvas", ariaLabel: "Open PlayCanvas editor bridge" },
      { href: "/settings", label: "Settings", ariaLabel: "Open settings" },
    ],
    [],
  );

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const redirectTarget = pathname || "/dashboard";
      router.replace(`/public-pages/auth?redirectTo=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    setAnnounce("Dashboard loaded.");
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p aria-live="polite" className="text-sm text-white/75">Loading dashboard…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav
        brand={<Link href="/dashboard" className="text-sm font-bold tracking-wide">Wonder Build</Link>}
        items={navItems}
        mobileMode="menu"
      />

      <div className="sr-only" aria-live="polite" aria-atomic="true">{announce}</div>

      <main id="dashboard-main" className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6">
        <PageHeader
          lead={<Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Workspace" }]} />}
          title="Workspace Dashboard"
          subtitle="Track projects, adjust settings, and launch builder workflows from a unified control plane."
          action={
            <Link
              href="/wonder-build"
              className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 text-sm font-bold"
            >
              Open Builder
            </Link>
          }
        />

        <section className="mt-6">{children}</section>
      </main>
    </div>
  );
}
