"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@lib/supabase/auth-context";

type NavGroup = { label: string; items: { name: string; href: string }[] };

export default function NavOverlay({ nav }: { nav: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthed = Boolean(user);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const mergedNav = useMemo<NavGroup[]>(() => {
    if (!isAuthed) return nav;

    const dashboardGroup: NavGroup = {
      label: "Dashboard",
      items: [
        { name: "Projects", href: "/dashboard/projects" },
        { name: "Subscription", href: "/subscription" },
        { name: "Settings", href: "/settings" },
      ],
    };

    // Put Dashboard at the top, keep the rest.
    return [dashboardGroup, ...nav];
  }, [isAuthed, nav]);

  return (
    <nav className="absolute top-0 z-20 w-full backdrop-blur-md bg-black/30">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-widest text-white">
          AI WONDERLAND
        </Link>

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20 transition"
            type="button"
          >
            Menu ✦
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              {mergedNav.map((g) => (
                <div
                  key={g.label}
                  className="border-b border-white/10 last:border-0"
                >
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/50">
                    {g.label}
                  </div>

                  {g.items.map((i) => (
                    <Link
                      key={i.name}
                      href={i.href}
                      className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                    >
                      {i.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
