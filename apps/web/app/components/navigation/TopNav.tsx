"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

type TopNavItem = {
  href: string;
  label: string;
};

type TopNavProps = {
  brand: ReactNode;
  items: TopNavItem[];
  actions?: ReactNode;
  mobileMode?: "menu" | "bottom-bar";
  variant?: "default" | "transparent";
};

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function TopNav({
  brand,
  items,
  actions,
  mobileMode = "menu",
  variant = "default",
}: TopNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isTransparent = variant === "transparent";

  const headerClasses = isTransparent
    ? "sticky top-0 z-40 border-b border-transparent bg-transparent"
    : "sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur";

  const navItemClasses = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
      active
        ? "bg-white/15 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  const mobileMenuPanelClasses = isTransparent
    ? "border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur md:hidden"
    : "border-t border-white/10 px-4 py-3 md:hidden";

  return (
    <>
      <header className={headerClasses}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {brand}

          <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
            {items.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={navItemClasses(active)}
                >
                  {item.label}
                </Link>
              );
            })}
            {actions}
          </nav>

          {mobileMode === "menu" ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          ) : null}
        </div>

        {mobileMode === "menu" && open ? (
          <div className={mobileMenuPanelClasses}>
            <nav aria-label="Mobile primary" className="flex flex-col gap-2">
              {items.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={navItemClasses(active)}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {actions ? <div className="pt-1">{actions}</div> : null}
            </nav>
          </div>
        ) : null}
      </header>

      {mobileMode === "bottom-bar" ? (
        <nav
          aria-label="Mobile bottom navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 px-2 py-2 md:hidden"
        >
          <ul className="grid grid-cols-4 gap-1">
            {items.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
