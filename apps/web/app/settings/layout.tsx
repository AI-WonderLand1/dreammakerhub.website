"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopNav } from "@/app/components/navigation/TopNav";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { BackButton } from "@/app/components/navigation/BackButton";
import { PageHeader } from "@/app/components/layout/PageHeader";

const SETTINGS_NAV_ITEMS = [
  { href: "/settings/account", label: "Account" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/accessibility", label: "Accessibility" },
  { href: "/settings/billing", label: "Billing & Licensing" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/subscriptions", label: "Subscriptions" },
  { href: "/settings/cloud-storage", label: "Cloud Storage (BYOC)" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav
        brand={<Link href="/dashboard" className="text-sm font-bold tracking-wide">Wonder Build</Link>}
        items={SETTINGS_NAV_ITEMS.map((item) => ({ href: item.href, label: item.label }))}
        mobileMode="bottom-bar"
      />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6">
        <PageHeader
          lead={
            <div className="flex items-center gap-2">
              <BackButton fallbackHref="/dashboard" />
              <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { href: "/settings", label: "Settings" }, { label: "Preferences" }]} />
            </div>
          }
          title="Settings"
          subtitle="Manage account, security, billing, and preferences with consistent controls across devices."
          action={
            <Link
              href="/settings/account"
              className="inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10"
            >
              Manage Account
            </Link>
          }
        />

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="hidden md:block" aria-label="Settings navigation">
            <ul className="space-y-2">
              {SETTINGS_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section>{children}</section>
        </div>
      </main>
    </div>
  );
}
