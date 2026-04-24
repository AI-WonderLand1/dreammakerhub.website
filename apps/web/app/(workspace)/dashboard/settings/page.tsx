"use client";

import React from "react";
import Link from "next/link";

export default function SettingsHomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link href="/dashboard/subscription" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">Subscription</div>
        <div className="mt-2 text-white/55">Upgrade or manage billing.</div>
      </Link>

      <Link href="/dashboard/usage" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">Usage & Limits</div>
        <div className="mt-2 text-white/55">View token usage and limits.</div>
      </Link>

      <Link href="/dashboard/agents" className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-6 hover:bg-violet-500/10 transition">
        <div className="text-xs font-black uppercase tracking-widest text-violet-300/80">AI Agents</div>
        <div className="mt-2 text-white/55">Configure Builder, Designer, Debugger agents.</div>
      </Link>

      <Link href="/dashboard/settings/webhooks" className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-6 hover:bg-orange-500/10 transition">
        <div className="text-xs font-black uppercase tracking-widest text-orange-300/80">Webhooks</div>
        <div className="mt-2 text-white/55">Set up automation webhooks.</div>
      </Link>

      <Link href="/dashboard/settings/byoc" className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6 hover:bg-blue-500/10 transition">
        <div className="text-xs font-black uppercase tracking-widest text-blue-300/80">Cloud Storage (BYOC)</div>
        <div className="mt-2 text-white/55">Connect your own cloud storage.</div>
      </Link>

      <Link href="/support" className="rounded-2xl border border-green-400/20 bg-green-500/5 p-6 hover:bg-green-500/10 transition">
        <div className="text-xs font-black uppercase tracking-widest text-green-300/80">Support</div>
        <div className="mt-2 text-white/55">Get help and report issues.</div>
      </Link>
    </div>
  );
}