"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Database,
  FolderKanban,
  Key,
  RefreshCw,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";

type PlanName = keyof typeof PLAN_LIMITS;

type UsageActivity = {
  action: string;
  tokens_used: number;
  compute_credits_used: number;
  api_calls: number;
  runtime_minutes: number;
  project_id: string | null;
  created_at: string;
};

type UsageSummary = {
  plan: string;
  period_start: string;
  period_reset: string;
  api_calls_used: number;
  tokens_used: number;
  compute_credits_used: number;
  runtime_minutes: number;
  projects_count: number;
  storage_used: number;
  recent_activity: UsageActivity[];
};

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

const normalizePlan = (value: unknown): PlanName => {
  const plan = typeof value === "string" ? value.toLowerCase() : "free";
  return plan === "pro" || plan === "team" || plan === "enterprise" ? plan : "free";
};

const percent = (used: number, limit: number) => {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

const prettyAction = (action: string) =>
  action.replace(/[_.-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const timeAgo = (iso: string) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function BillingUsagePage() {
  const [plan, setPlan] = useState<PlanName>("free");
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsage = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("Usage service is not configured.");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("You must be signed in to view usage.");

      const authHeaders = { Authorization: `Bearer ${token}` };
      const [usageResponse, keysResponse, projectsResponse] = await Promise.all([
        fetch("/api/usage", {
          headers: authHeaders,
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/keys", {
          headers: authHeaders,
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetchAuthenticatedProject("/api/projects"),
      ]);

      const usagePayload = await usageResponse.json().catch(() => ({}));
      const keysPayload = await keysResponse.json().catch(() => ({}));
      const projectsPayload = await projectsResponse.json().catch(() => ({}));

      if (!usageResponse.ok || !usagePayload?.usage) {
        throw new Error(usagePayload?.error || "Live usage could not be loaded.");
      }
      if (!keysResponse.ok) {
        throw new Error(keysPayload?.error || "API keys could not be loaded.");
      }
      if (!projectsResponse.ok || !Array.isArray(projectsPayload?.projects)) {
        throw new Error(projectsPayload?.message || projectsPayload?.error || "Projects could not be loaded.");
      }

      const summary = usagePayload.usage as UsageSummary;
      setUsage(summary);
      setPlan(normalizePlan(summary.plan));
      setApiKeys(Array.isArray(keysPayload?.keys) ? keysPayload.keys : []);
      setProjectCount(projectsPayload.projects.length);
      setLastUpdated(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load live billing usage.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const scheduleRefresh = () => {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => void loadUsage(), 500);
      };

      channel = supabase
        .channel(`billing-usage:${data.user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "usage_logs", filter: `user_id=eq.${data.user.id}` },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_profiles", filter: `id=eq.${data.user.id}` },
          scheduleRefresh,
        )
        .subscribe((status: string) => setLive(status === "SUBSCRIBED"));
    });

    return () => {
      cancelled = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadUsage]);

  if (loading) {
    return <div className="p-6 text-white/50">Loading live usage...</div>;
  }

  const limits = PLAN_LIMITS[plan];
  const tokensUsed = Number(usage?.tokens_used ?? 0);
  const apiCallsUsed = Number(usage?.api_calls_used ?? 0);
  const storageUsed = Number(usage?.storage_used ?? 0);
  const tokenPct = percent(tokensUsed, limits.aiTokensMonthly);
  const apiPct = percent(apiCallsUsed, limits.apiCallsMonthly);
  const storagePct = percent(storageUsed, limits.storageLimit);
  const activeKeys = apiKeys.filter((key) => !key.revoked_at);
  const recentActivity = usage?.recent_activity ?? [];

  return (
    <div className="max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Usage & Billing</h1>
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                live
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/40"
              }`}
            >
              {live ? "Live" : "Connected"}
            </span>
          </div>
          <p className="text-sm text-white/50">Current plan: {plan}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/40">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            type="button"
            onClick={() => void loadUsage()}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link href="/subscription" className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white">
            <CreditCard size={16} />
            Upgrade Plan
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50"><Zap size={14} /> AI Tokens</div>
          <div className="mb-2 text-2xl font-bold">
            {formatNumber(tokensUsed)}
            <span className="text-sm font-normal text-white/50"> / {formatNumber(limits.aiTokensMonthly)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${tokenPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/40">From live usage logs this billing period.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50"><ArrowUpRight size={14} /> API Requests</div>
          <div className="mb-2 text-2xl font-bold">
            {formatNumber(apiCallsUsed)}
            <span className="text-sm font-normal text-white/50"> / {formatNumber(limits.apiCallsMonthly)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${apiPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/40">From live usage logs this billing period.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50"><FolderKanban size={14} /> Projects</div>
          <div className="text-2xl font-bold">
            {projectCount}
            <span className="text-sm font-normal text-white/50"> / {limits.projectsLimit}</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Counted from your actual DreamMakerHub projects.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50"><Database size={14} /> Storage Usage</div>
          <div className="mb-2 text-2xl font-bold">
            {formatBytes(storageUsed)}
            <span className="text-sm font-normal text-white/50"> / {formatBytes(limits.storageLimit)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${storagePct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/40">Reported by the current usage summary.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-300"><Activity size={14} /> Current Billing Period</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-white/60">AI tokens</span><span>{formatNumber(tokensUsed)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-white/60">API requests</span><span>{formatNumber(apiCallsUsed)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-white/60">Storage reported</span><span>{formatBytes(storageUsed)}</span></div>
            {usage?.period_start && (
              <div className="flex justify-between gap-4"><span className="text-white/60">Period started</span><span>{new Date(usage.period_start).toLocaleDateString()}</span></div>
            )}
            {usage?.period_reset && (
              <div className="flex justify-between gap-4"><span className="text-white/60">Resets</span><span>{new Date(usage.period_reset).toLocaleDateString()}</span></div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-cyan-300"><Key size={14} /> API Keys</div>
          {activeKeys.length === 0 ? (
            <p className="text-sm text-white/40">No active API keys.</p>
          ) : (
            <div className="space-y-2">
              {activeKeys.slice(0, 6).map((key) => (
                <div key={key.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-white/80">{key.name}</div>
                    <div className="text-[11px] text-white/35">
                      {key.last_used_at ? `Last used ${timeAgo(key.last_used_at)}` : "Never used"}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-white/40">{key.prefix}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/settings/api-keys" className="mt-4 inline-block text-xs font-semibold text-cyan-300 hover:underline">
            Manage API keys →
          </Link>
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Recent activity</h2>
          {live && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Streaming</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/45">
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3 text-right">API</th>
                <th className="py-2 pr-3 text-right">Tokens</th>
                <th className="py-2 pr-3 text-right">Runtime</th>
                <th className="py-2 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentActivity.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-white/35">No metered activity yet this cycle.</td></tr>
              ) : recentActivity.map((row, index) => (
                <tr key={`${row.created_at}-${index}`}>
                  <td className="py-2 pr-3">{prettyAction(row.action)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.api_calls}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatNumber(row.tokens_used)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.runtime_minutes}m</td>
                  <td className="py-2 text-right text-white/40">{timeAgo(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-4 font-semibold">Active Plan Limits</h2>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="flex justify-between"><span className="text-white/60">Projects</span><span>{limits.projectsLimit}</span></div>
          <div className="flex justify-between"><span className="text-white/60">AI tokens / month</span><span>{formatNumber(limits.aiTokensMonthly)}</span></div>
          <div className="flex justify-between"><span className="text-white/60">API requests / month</span><span>{formatNumber(limits.apiCallsMonthly)}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Storage allowance</span><span>{formatBytes(limits.storageLimit)}</span></div>
        </div>
        <p className="mt-4 text-xs text-white/35">
          Full Coder workspace, runtime-hour, and compute-credit limits are parked with the future full IDE and are not presented as active customer usage here.
        </p>
      </section>

      {(tokenPct >= 75 || apiPct >= 75 || storagePct >= 75) && (
        <div className="mb-6 flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-300">Usage warning</h3>
            <p className="mt-1 text-sm text-white/60">One of your active tracked limits is above 75%.</p>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 pt-6">
        <h2 className="mb-4 font-semibold">Billing & Storage</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/settings/byoc" className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <div className="font-medium">Connect Storage</div>
            <div className="mt-1 text-xs text-white/50">Use your own S3, GCS, or R2.</div>
          </Link>
          <Link href="/subscription" className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <div className="font-medium">Plans & Billing</div>
            <div className="mt-1 text-xs text-white/50">Upgrade your plan or continue to billing management.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
