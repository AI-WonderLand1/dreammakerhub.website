"use client";

import type { ReactNode } from "react";
import { BillingCenterSidebar } from "@/components/billing/BillingAccountSections";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <BillingCenterSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
