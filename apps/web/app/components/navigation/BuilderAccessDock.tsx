"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackButton } from "@/app/components/navigation/BackButton";

import { BUILDER_DOCK_FOOTER_LINKS, BUILDER_LINKS } from "./BuilderAccessDock.links";

export function BuilderAccessDock() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Global builder navigation"
      className="fixed bottom-4 right-4 z-50 w-[min(92vw,22rem)] rounded-xl border border-white/15 bg-black/85 p-3 text-white shadow-2xl backdrop-blur"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Builder access</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {BUILDER_LINKS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "border-cyan-300/80 bg-cyan-500/20 text-cyan-100"
                  : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <BackButton fallbackHref={BUILDER_DOCK_FOOTER_LINKS.leavePageFallbackHref} label="Leave page" />
        <Link
          href={BUILDER_DOCK_FOOTER_LINKS.dashboardHref}
          className="inline-flex h-9 items-center rounded-lg border border-white/20 bg-white/5 px-3 text-sm font-semibold text-white/85 hover:bg-white/10"
        >
          Dashboard
        </Link>
      </div>
    </aside>
  );
}
