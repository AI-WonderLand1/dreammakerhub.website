"use client";

import React from "react";
import Link from "next/link";

export default function SettingsHomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">
          Subscription
        </div>
        <div className="mt-2 text-white/55">
          Upgrade, cancel, or manage billing.
        </div>
        <Link
          href="/dashboard/subscription"
          className="mt-4 inline-flex h-10 px-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 hover:bg-cyan-500/15 transition text-sm font-bold text-cyan-200 items-center"
        >
          Open Subscription →
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">
          Features
        </div>
        <div className="mt-2 text-white/55">
          See which features exist and what’s enabled.
        </div>
        <Link
          href="/dashboard/features"
          className="mt-4 inline-flex h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-white/80 items-center"
        >
          Open Features →
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">
          Webhooks
        </div>
        <div className="mt-2 text-white/55">
          Send project events to external services (GitHub-style).
        </div>
        <Link
          href="/dashboard/settings/webhooks"
          className="mt-4 inline-flex h-10 px-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15 transition text-sm font-bold text-emerald-200 items-center"
        >
          Open Webhooks →
        </Link>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">
          Bring Your Own Cloud (BYOC)
        </div>
        <div className="mt-2 text-white/55">
          Connect customer-owned cloud environments for isolated deployments and full tenant control.
        </div>
        <Link
          href="/dashboard/settings/byoc"
          className="mt-4 inline-flex h-10 px-4 rounded-xl border border-violet-400/25 bg-violet-500/10 hover:bg-violet-500/15 transition text-sm font-bold text-violet-200 items-center"
        >
          Open BYOC →
        </Link>
      </div>

    </div>
  );
}
