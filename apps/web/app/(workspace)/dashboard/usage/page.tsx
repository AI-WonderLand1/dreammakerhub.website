"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
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
import { formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";

type PlanName = keyof typeof PLAN_LIMITS;

type UsageQuota = {
  aiTokensUsed: number;
  apiRequestsCount: number;
  monthlyLimit: number;
  lastResetDate: string | null;
};

type ApiToken = {
  id: string;
  provider: string;
  keyHint: string | null;
  isActive: boolean;
};

const normalizePlan = (value: unknown): PlanName => {
  const plan = typeof value === "string" ? value.toLowerCase() : "free";
  return plan === "pro" || plan === "team" || plan === "enterprise" ? plan : "free";
};

const percent = (used: number, limit: number) => {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

export default function BillingUsagePage() {
  const [plan, setPlan] = useState<PlanName>("free");
  const [quota, setQuota] = useState<UsageQuota>({
    aiTokensUsed: 0,
    apiRequestsCount: 0,
    monthlyLimit: 1000,
    lastResetDate: null,
  });
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadUsage = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("You must be signed in to view usage.");

      const [profileResult, quotaResult, tokensResult, projectsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("usage_quotas")
          .select("ai_tokens_used, api_requests_count, monthly_limit, last_reset_date")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_api_tokens")
          .select("id, provider, key_hint, is_active")
          .eq("user_id", user.id),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (quotaResult.error) throw quotaResult.error;
      if (tokensResult.error) throw tokensResult.error;
      if (projectsResult.error) throw projectsResult.error;

      const resolvedPlan = normalizePlan(profileResult.data?.subscription_tier);
      const quotaRow = quotaResult.data;

      setPlan(resolvedPlan);
      setQuota({
        aiTokensUsed: Number(quotaRow?.ai_tokens_used ?? 0),
        apiRequestsCount: Number(quotaRow?.api_requests_count ?? 0),
        monthlyLimit: Number(quotaRow?.monthly_limit ?? PLAN_LIMITS[resolvedPlan].aiTokensMonthly),
        lastResetDate: quotaRow?.last_reset_date ?? null,
      });
      setApiTokens(
        (tokensResult.data ?? []).map((token) => ({
          id: token.id,
          provider: token.provider,
          keyHint: token.key_hint,
          isActive: token.is_active ?? true,
        }))
      );
      setProjectCount(projectsResult.count ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing usage.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  if (loading) {
    return <div className="p-6 text-white/50">Loading usage...</div>;
  }

  const limits = PLAN_LIMITS[plan];
  const tokenLimit = quota.monthlyLimit || limits.aiTokensMonthly;
  const tokenPct = percent(quota.aiTokensUsed, tokenLimit);
  const apiPct = percent(quota.apiRequestsCount, limits.apiCallsMonthly);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usage & Billing</h1>
          <p className="text-sm text-white/50">Current plan: {plan}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/40">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
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
          <Link
            href="/subscription"
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white"
          >
            <CreditCard size={16} />
            Upgrade Plan
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50">
            <Zap size={14} /> AI Tokens
          </div>
          <div className="mb-2 text-2xl font-bold">
            {formatNumber(quota.aiTokensUsed)}
            <span className="text-sm font-normal text-white/50"> / {formatNumber(tokenLimit)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${tokenPct}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50">
            <ArrowUpRight size={14} /> API Requests
          </div>
          <div className="mb-2 text-2xl font-bold">
            {formatNumber(quota.apiRequestsCount)}
            <span className="text-sm font-normal text-white/50"> / {formatNumber(limits.apiCallsMonthly)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${apiPct}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50">
            <FolderKanban size={14} /> Projects
          </div>
          <div className="text-2xl font-bold">
            {projectCount}
            <span className="text-sm font-normal text-white/50"> / {limits.projectsLimit}</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Counted from your real projects.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50">
            <Database size={14} /> Storage Usage
          </div>
          <div className="text-lg font-semibold text-white/70">Not tracked</div>
          <p className="mt-2 text-xs text-white/40">
            Plan allowance: {formatBytes(limits.storageLimit)}. No live storage-usage counter exists in the current billing schema.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-300">
            <Zap size={14} /> Usage Quota
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-white/60">AI Tokens</span>
                <span>{formatNumber(quota.aiTokensUsed)} / {formatNumber(tokenLimit)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${tokenPct}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">API Requests</span>
              <span>{formatNumber(quota.apiRequestsCount)}</span>
            </div>
            {quota.lastResetDate && (
              <div className="text-xs text-white/40">
                Last reset: {new Date(quota.lastResetDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-cyan-300">
            <Key size={14} /> API Keys
          </div>
          {apiTokens.length === 0 ? (
            <p className="text-sm text-white/40">No API keys configured.</p>
          ) : (
            <div className="space-y-2">
              {apiTokens.slice(0, 6).map((token) => (
                <div key={token.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${token.isActive ? "bg-green-400" : "bg-white/30"}`} />
                    <span className="capitalize">{token.provider}</span>
                  </div>
                  <span className="font-mono text-xs text-white/40">{token.keyHint || "••••"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-4 font-semibold">Plan Limits</h2>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="flex justify-between"><span className="text-white/60">Projects</span><span>{limits.projectsLimit}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Workspaces</span><span>{limits.workspacesLimit}</span></div>
          <div className="flex justify-between"><span className="text-white/60">IDE Sessions</span><span>{limits.ideSessionsLimit}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Compute credits/mo</span><span>{formatNumber(limits.computeCreditsMonthly)}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Storage allowance</span><span>{formatBytes(limits.storageLimit)}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Runtime hours/mo</span><span>{limits.runtimeHoursMonthly}</span></div>
        </div>
      </section>

      {(tokenPct >= 75 || apiPct >= 75) && (
        <div className="mb-6 flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-300">Usage warning</h3>
            <p className="mt-1 text-sm text-white/60">One of your tracked monthly usage counters is above 75%.</p>
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
          <Link href="/settings/billing" className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <div className="font-medium">Billing & Invoices</div>
            <div className="mt-1 text-xs text-white/50">Manage payment methods and invoices.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
