"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { BackButton } from "@/app/components/navigation/BackButton";
import { PageHeader } from "@/app/components/layout/PageHeader";

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

const TABS = [
  { href: "/dashboard/settings", label: "Overview" },
  { href: "/dashboard/subscription", label: "Subscription" },
  { href: "/dashboard/features", label: "Features" },
  { href: "/dashboard/settings/webhooks", label: "Webhooks" },
  { href: "/dashboard/settings/byoc", label: "BYOC" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#070718] to-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-8 pb-24">
        <PageHeader
          lead={
            <div className="flex items-center gap-2">
              <BackButton fallbackHref="/dashboard" />
              <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Settings" }]} />
            </div>
          }
          title="Dashboard Settings"
          subtitle="Manage features, subscriptions, and developer integrations."
          action={
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          }
        />

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-2">
          <nav className="flex flex-wrap gap-2" aria-label="Dashboard settings tabs">
            {TABS.map((t) => {
              const isActive = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cx(
                    "inline-flex h-10 items-center rounded-xl border px-4 text-sm font-bold",
                    isActive
                      ? "border-white/25 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
