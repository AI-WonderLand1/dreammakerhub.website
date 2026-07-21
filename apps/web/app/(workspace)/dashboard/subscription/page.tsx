"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";

import { PLANS, type PlanId } from "@/lib/billing/plans";
import { logger } from '@/lib/logger';
export default function SubscriptionPage() {
  const { user, session } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const currentPlan = (user?.user_metadata?.plan || "free") as PlanId;
  const plan = PLANS[currentPlan] || PLANS.free;

  const handleUpgrade = async () => {
    if (!session) {
      window.location.href = "/public-pages/auth";
      return;
    }
    window.location.href = "/subscription";
  };

  const handleManageBilling = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert("Could not open billing portal. Please try again.");
    } catch (e) {
      alert("Could not open billing portal.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel? You'll keep access until the period ends.")) return;
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) alert("Subscription cancelled. You'll have access until the period ends.");
      else alert("Could not cancel subscription.");
    } catch (e) {
      alert("Could not cancel subscription.");
    } finally {
      setLoading(false);
    }
  };

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
              Manage your AI-Wonderland plan and billing.
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
          <div className="mt-2 text-white/60">{plan.displayName} ({plan.priceDisplay})</div>

          <div className="mt-6 flex flex-wrap gap-3">
            {currentPlan === "free" ? (
              <button
                type="button"
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:opacity-90 transition"
                onClick={handleUpgrade}
              >
                Upgrade to The Architect
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="h-10 px-5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-bold hover:bg-cyan-500/20 transition"
                  onClick={handleManageBilling}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Manage Billing"}
                </button>

                {currentPlan !== "enterprise" && (
                  <button
                    type="button"
                    className="h-10 px-5 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200 font-bold hover:bg-red-500/15 transition"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-bold text-white/80">Why AI-Wonderland?</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 text-white/50">Feature</th>
                  <th className="py-2 text-purple-400">AI-Wonderland</th>
                  <th className="py-2 text-white/40">v0.dev</th>
                  <th className="py-2 text-white/40">Bolt.new</th>
                  <th className="py-2 text-white/40">Cursor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                <tr>
                  <td className="py-2">Browser IDE (WebContainer)</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                </tr>
                <tr>
                  <td className="py-2">3D / PlayCanvas Engine</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                </tr>
                <tr>
                  <td className="py-2">AI Code Generation</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2 text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2">Full-Stack Deploy</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2">—</td>
                </tr>
                <tr>
                  <td className="py-2">Visual Editor (Puck)</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                </tr>
                <tr>
                  <td className="py-2">Team Collaboration</td>
                  <td className="py-2 text-green-400">✓</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                  <td className="py-2 text-green-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
