"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

import { PLANS, type PlanId } from "@/lib/billing/plans";
import { logger } from '@/lib/logger';

type UsageSummary = {
  plan: PlanId;
  period_start: string;
  period_reset: string;
  api_calls_used: number;
  tokens_used: number;
  compute_credits_used: number;
  runtime_minutes: number;
  projects_count: number;
  storage_used: number;
  recent_activity: {
    action: string;
    tokens_used: number;
    compute_credits_used: number;
    api_calls: number;
    runtime_minutes: number;
    project_id: string | null;
    created_at: string;
  }[];
};

type UsageLimits = {
  projects: number | null;
  aiTokens: number | null;
  apiCalls: number | null;
  storageBytes: number | null;
  runtimeHours: number | null;
  computeCredits: number | null;
  teamSeats: number | null;
};

const USAGE_LIMITS: Record<PlanId, UsageLimits> = {
  free: {
    projects: 1,
    aiTokens: 5_000,
    apiCalls: 100,
    storageBytes: 100 * 1024 * 1024,
    runtimeHours: 10,
    computeCredits: 10_000,
    teamSeats: 1,
  },
  pro: {
    projects: 5,
    aiTokens: 100_000,
    apiCalls: 10_000,
    storageBytes: 5 * 1024 * 1024 * 1024,
    runtimeHours: 10,
    computeCredits: 100_000,
    teamSeats: 1,
  },
  team: {
    projects: 10,
    aiTokens: 500_000,
    apiCalls: 100_000,
    storageBytes: 50 * 1024 * 1024 * 1024,
    runtimeHours: 50,
    computeCredits: 300_000,
    teamSeats: 5,
  },
  enterprise: {
    projects: null,
    aiTokens: null,
    apiCalls: null,
    storageBytes: null,
    runtimeHours: null,
    computeCredits: null,
    teamSeats: null,
  },
};

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function prettyAction(action: string) {
  return action.replace(/[_.-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SubscriptionPage() {
  const { user, session } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const [usage, setUsage] = React.useState<UsageSummary | null>(null);
  const [live, setLive] = React.useState(false);
  const refreshTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPlan = ((usage?.plan || user?.user_metadata?.plan || "free") as PlanId);
  const plan = PLANS[currentPlan] || PLANS.free;
  const limits = USAGE_LIMITS[currentPlan];

  const fetchUsage = React.useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/usage", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok && data?.usage) setUsage(data.usage as UsageSummary);
    } catch (e) {
      logger.error("Usage fetch failed:", e);
    }
  }, [session?.access_token]);

  React.useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  React.useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(fetchUsage, 600);
    };

    const channel = supabase
      .channel(`private-usage:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usage_logs", filter: `user_id=eq.${user.id}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_profiles", filter: `id=eq.${user.id}` },
        scheduleRefresh
      )
      .subscribe((status: string) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [user?.id, fetchUsage]);

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

  const metrics = [
    {
      label: "API Calls",
      used: usage?.api_calls_used ?? 0,
      limit: limits.apiCalls,
      display: (n: number) => compact(n),
    },
    {
      label: "AI Tokens",
      used: usage?.tokens_used ?? 0,
      limit: limits.aiTokens,
      display: (n: number) => compact(n),
    },
    {
      label: "Compute Credits",
      used: usage?.compute_credits_used ?? 0,
      limit: limits.computeCredits,
      display: (n: number) => compact(n),
    },
    {
      label: "Runtime Hours",
      used: Math.round((usage?.runtime_minutes ?? 0) / 6) / 10,
      limit: limits.runtimeHours,
      display: (n: number) => `${n}h`,
    },
    {
      label: "Storage",
      used: usage?.storage_used ?? 0,
      limit: limits.storageBytes,
      display: (n: number) => formatBytes(n),
    },
    {
      label: "Active Projects",
      used: usage?.projects_count ?? 0,
      limit: limits.projects,
      display: (n: number) => String(n),
    },
    {
      label: "Team Seats",
      used: 1,
      limit: limits.teamSeats,
      display: (n: number) => String(n),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#070718] to-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
              Settings
            </div>
            <h1 className="mt-2 text-3xl font-extrabold">Subscription &amp; Billing</h1>
            <div className="mt-2 text-white/55">
              Manage your AI Wonderland plan and billing.
            </div>
          </div>

          <Link
            href="/dashboard"
            className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-white/80 inline-flex items-center"
          >
            ← Back
          </Link>
        </div>

        {/* Current Plan */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-white/90">Current Plan</div>
              <div className="mt-2 text-white/60">{plan.displayName} ({plan.priceDisplay})</div>
            </div>
            <span
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                live
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/40"
              }`}
              title={live ? "Realtime usage streaming is connected" : "Connecting to realtime…"}
            >
              <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
              {live ? "Live · Realtime" : "Offline"}
            </span>
          </div>

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

        {/* Usage This Cycle */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-lg font-bold text-white/90">Usage this cycle</div>
            {usage?.period_reset && (
              <div className="text-xs text-white/45">
                Resets {new Date(usage.period_reset).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {metrics.map((m) => {
              const pct = m.limit ? Math.min(100, Math.round((m.used / m.limit) * 100)) : 0;
              const barColor =
                pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
              return (
                <div key={m.label} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white/75">{m.label}</span>
                    <span className="text-white/45">
                      {m.display(m.used)}
                      {" / "}
                      {m.limit == null ? "∞" : m.display(m.limit)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: m.limit == null ? "100%" : `${pct}%`, opacity: m.limit == null ? 0.25 : 1 }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-white/35">
                    {m.limit == null ? "Unlimited" : `${pct}% of plan quota`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Activity Feed */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white/80">Recent activity</div>
              {live && (
                <div className="text-[11px] uppercase tracking-widest text-emerald-300/70">
                  Streaming
                </div>
              )}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-3 text-white/50">Action</th>
                    <th className="py-2 pr-3 text-right text-white/50">API</th>
                    <th className="py-2 pr-3 text-right text-white/50">Tokens</th>
                    <th className="py-2 pr-3 text-right text-white/50">Credits</th>
                    <th className="py-2 text-right text-white/50">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/70">
                  {(usage?.recent_activity ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-white/35 text-sm">
                        No activity yet this cycle.
                      </td>
                    </tr>
                  ) : (
                    usage!.recent_activity.map((row, i) => (
                      <tr key={`${row.created_at}-${i}`}>
                        <td className="py-2 pr-3">{prettyAction(row.action)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{row.api_calls}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{compact(row.tokens_used)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{compact(row.compute_credits_used)}</td>
                        <td className="py-2 text-right text-white/40 whitespace-nowrap">{timeAgo(row.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-bold text-white/80">Why AI Wonderland?</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 text-white/50">Feature</th>
                  <th className="py-2 text-purple-400">AI Wonderland</th>
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
                  <td className="py-2">Visual Editor (WonderBuild)</td>
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
