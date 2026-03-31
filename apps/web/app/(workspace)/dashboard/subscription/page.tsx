"use client";

import React from "react";
import Link from "next/link";

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#070718] to-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
              Settings
            </div>
            <h1 className="mt-2 text-3xl font-extrabold">Subscription</h1>
            <div className="mt-2 text-white/55">
              Upgrade, manage billing, or cancel.
            </div>
          </div>

          <Link
            href="/dashboard"
            className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-white/80 inline-flex items-center"
          >
            ← Back
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-bold text-white/90">Current Plan</div>
          <div className="mt-2 text-white/60">Free / Starter</div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="h-10 px-5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-bold hover:bg-cyan-500/20 transition"
              onClick={() => alert("Upgrade flow coming next (Stripe).")}
            >
              Upgrade Plan
            </button>

            <button
              type="button"
              className="h-10 px-5 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200 font-bold hover:bg-red-500/15 transition"
              onClick={() => alert("Cancel flow coming next (Stripe customer portal).")}
            >
              Cancel Subscription
            </button>
          </div>

          <div className="mt-4 text-xs text-white/40">
            This is the UI surface. Next step is wiring Stripe (checkout + customer portal).
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-bold text-white/80">Billing Notes</div>
          <ul className="mt-3 text-sm text-white/55 list-disc pl-5 space-y-2">
            <li>Upgrades should take effect immediately.</li>
            <li>Cancellations should keep access until the period ends.</li>
            <li>Plan gates should be enforced server-side for exports/builds.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
