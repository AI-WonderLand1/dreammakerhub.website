"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserLimits, formatBytes, formatNumber, PLAN_LIMITS } from "@/lib/billing/limits";
import { 
  BarChart3, 
  Zap, 
  Database, 
  Clock, 
  Users, 
  CreditCard, 
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Gamepad2,
  Bot,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";

type UsageData = {
  plan: string;
  storageLimit: number;
  storageUsed: number;
  projectsLimit: number;
  computeCreditsMonthly: number;
  computeUsed: number;
  aiTokensMonthly: number;
  aiTokensUsed: number;
  apiCallsMonthly: number;
  apiCallsUsed: number;
  runtimeHoursMonthly: number;
  runtimeHoursUsed: number;
};

type PlaygroundUsage = {
  totalTokens: number;
  lastModel: string;
  lastSynced: string;
  playgroundSessions: number;
};

type TokenBalance = {
  balance: number;
  lastUpdated: string;
  recentTransactions: Array<{
    action: string;
    amount: number;
    reason: string;
    created_at: string;
  }>;
};

export default function BillingUsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [playground, setPlayground] = useState<PlaygroundUsage | null>(null);
  const [tokens, setTokens] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchPlaygroundData = useCallback(async (uid: string) => {
    try {
      const playgroundRes = await fetch(`/api/sync/playground-usage?userId=${uid}`);
      const playgroundData = await playgroundRes.json();
      if (playgroundData.ok) {
        setPlayground({
          totalTokens: playgroundData.combined?.totalTokens || 0,
          lastModel: playgroundData.playground?.last_model || "N/A",
          lastSynced: playgroundData.playground?.synced_at || "",
          playgroundSessions: 0,
        });
      }
    } catch (e) {
      console.error("Failed to fetch playground usage:", e);
    }

    try {
      const tokensRes = await fetch(`/api/sync/playground-tokens?userId=${uid}`);
      const tokensData = await tokensRes.json();
      if (tokensData.ok) {
        setTokens({
          balance: tokensData.balance || 0,
          lastUpdated: tokensData.lastUpdated || "",
          recentTransactions: tokensData.transactions?.slice(0, 5) || [],
        });
      }
    } catch (e) {
      console.error("Failed to fetch token balance:", e);
    }

    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    const loadUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        // Fetch main usage
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setUsage({
            plan: data.subscription_plan,
            storageLimit: data.storage_limit,
            storageUsed: data.storage_used || 0,
            projectsLimit: data.projects_limit,
            computeCreditsMonthly: data.compute_credits_monthly,
            computeUsed: data.compute_used || 0,
            aiTokensMonthly: data.ai_tokens_monthly,
            aiTokensUsed: data.ai_tokens_used || 0,
            apiCallsMonthly: data.api_calls_monthly,
            apiCallsUsed: data.api_calls_used || 0,
            runtimeHoursMonthly: data.runtime_hours_monthly,
            runtimeHoursUsed: data.runtime_hours_used || 0,
          });
        }

        // Initial fetch of playground data
        await fetchPlaygroundData(user.id);

        // Set up real-time subscriptions
        const usageChannel = supabase
          .channel('playground-usage-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'playground_usage', filter: `user_id=eq.${user.id}` },
            (payload) => {
              console.log('Playground usage updated:', payload);
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newData = payload.new as any;
                setPlayground(prev => prev ? {
                  ...prev,
                  totalTokens: newData.total_tokens || prev.totalTokens,
                  lastModel: newData.last_model || prev.lastModel,
                  lastSynced: newData.synced_at || prev.lastSynced,
                } : prev);
                setLastUpdate(new Date());
              }
            }
          )
          .subscribe((status) => {
            setIsRealTimeConnected(status === 'SUBSCRIBED');
          });

        const tokensChannel = supabase
          .channel('token-balance-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'token_balances', filter: `user_id=eq.${user.id}` },
            (payload) => {
              console.log('Token balance updated:', payload);
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newData = payload.new as any;
                setTokens(prev => prev ? {
                  ...prev,
                  balance: newData.balance || prev.balance,
                  lastUpdated: newData.last_updated || prev.lastUpdated,
                } : prev);
                setLastUpdate(new Date());
              }
            }
          )
          .subscribe();

        const transactionsChannel = supabase
          .channel('token-transactions-changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'token_transactions', filter: `user_id=eq.${user.id}` },
            (payload) => {
              console.log('New transaction:', payload);
              if (payload.eventType === 'INSERT') {
                const newTx = payload.new as any;
                setTokens(prev => prev ? {
                  ...prev,
                  recentTransactions: [newTx, ...prev.recentTransactions].slice(0, 5),
                } : prev);
                setLastUpdate(new Date());
              }
            }
          )
          .subscribe();

        const sessionsChannel = supabase
          .channel('playground-sessions-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'playground_sessions', filter: `user_id=eq.${user.id}` },
            (payload) => {
              console.log('Session status updated:', payload);
              setLastUpdate(new Date());
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(usageChannel);
          supabase.removeChannel(tokensChannel);
          supabase.removeChannel(transactionsChannel);
          supabase.removeChannel(sessionsChannel);
        };
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [fetchPlaygroundData]);

  // Manual refresh
  const handleRefresh = async () => {
    if (userId) {
      await fetchPlaygroundData(userId);
    }
  };

  const getPercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getStatus = (percentage: number) => {
    if (percentage >= 90) return { icon: XCircle, color: "text-red-500", label: "Critical" };
    if (percentage >= 75) return { icon: AlertTriangle, color: "text-yellow-500", label: "Warning" };
    return { icon: CheckCircle, color: "text-green-500", label: "OK" };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-white/50">Loading usage...</div>
      </div>
    );
  }

  const planLimits = PLAN_LIMITS[usage?.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usage & Billing</h1>
          <p className="text-sm text-white/50">Current plan: {usage?.plan || "free"}</p>
        </div>
        <Link
          href="/subscription"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium"
        >
          <CreditCard size={16} />
          Upgrade Plan
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* AI Tokens */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Zap size={14} />
            AI Tokens
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatNumber(usage?.aiTokensUsed || 0)}
            <span className="text-sm font-normal text-white/50"> / {formatNumber(usage?.aiTokensMonthly || 0)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                getPercentage(usage?.aiTokensUsed || 0, usage?.aiTokensMonthly || 1) >= 75 
                  ? "bg-yellow-500" 
                  : "bg-orange-500"
              }`}
              style={{ width: `${getPercentage(usage?.aiTokensUsed || 0, usage?.aiTokensMonthly || 1)}%` }}
            />
          </div>
        </div>

        {/* API Calls */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <ArrowUpRight size={14} />
            API Calls
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatNumber(usage?.apiCallsUsed || 0)}
            <span className="text-sm font-normal text-white/50"> / {formatNumber(usage?.apiCallsMonthly || 0)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                getPercentage(usage?.apiCallsUsed || 0, usage?.apiCallsMonthly || 1) >= 75 
                  ? "bg-yellow-500" 
                  : "bg-green-500"
              }`}
              style={{ width: `${getPercentage(usage?.apiCallsUsed || 0, usage?.apiCallsMonthly || 1)}%` }}
            />
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Database size={14} />
            Storage
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatBytes(usage?.storageUsed || 0)}
            <span className="text-sm font-normal text-white/50"> / {formatBytes(usage?.storageLimit || 0)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                getPercentage(usage?.storageUsed || 0, usage?.storageLimit || 1) >= 75 
                  ? "bg-yellow-500" 
                  : "bg-blue-500"
              }`}
              style={{ width: `${getPercentage(usage?.storageUsed || 0, usage?.storageLimit || 1)}%` }}
            />
          </div>
        </div>

        {/* Runtime Hours */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Clock size={14} />
            Runtime
          </div>
          <div className="text-2xl font-bold mb-1">
            {usage?.runtimeHoursUsed || 0}
            <span className="text-sm font-normal text-white/50"> / {usage?.runtimeHoursMonthly || 0}h</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${getPercentage(usage?.runtimeHoursUsed || 0, usage?.runtimeHoursMonthly || 1)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Playground & Token Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Playground Tokens */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
          <div className="flex items-center gap-2 text-violet-400 text-sm mb-2">
            <Gamepad2 size={14} />
            Playground Tokens
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatNumber(playground?.totalTokens || 0)}
          </div>
          <div className="text-xs text-white/50">
            {playground?.lastModel !== "N/A" ? `Last model: ${playground?.lastModel}` : "No activity yet"}
          </div>
          {playground?.lastSynced && (
            <div className="text-xs text-white/40 mt-1">
              Synced: {new Date(playground.lastSynced).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Token Balance */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
            <Bot size={14} />
            Token Balance
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatNumber(tokens?.balance || 0)}
          </div>
          <div className="text-xs text-white/50">
            {tokens?.lastUpdated ? `Updated: ${new Date(tokens.lastUpdated).toLocaleDateString()` : "No balance"}
          </div>
          {tokens?.recentTransactions && tokens.recentTransactions.length > 0 && (
            <div className="text-xs text-white/40 mt-1">
              Last: {tokens.recentTransactions[0].action} {formatNumber(tokens.recentTransactions[0].amount)}
            </div>
          )}
        </div>

        {/* Combined Usage */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
            <BarChart3 size={14} />
            Combined AI Usage
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatNumber((usage?.aiTokensUsed || 0) + (playground?.totalTokens || 0))}
          </div>
          <div className="text-xs text-white/50">
            Main: {formatNumber(usage?.aiTokensUsed || 0)} + Playground: {formatNumber(playground?.totalTokens || 0)}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-violet-500 rounded-full"
              style={{ 
                width: `${getPercentage(
                  (usage?.aiTokensUsed || 0) + (playground?.totalTokens || 0), 
                  (usage?.aiTokensMonthly || 1) + (playground?.totalTokens || 1)
                )}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
        <h2 className="font-semibold mb-4">Plan Limits</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Projects</span>
            <span>{usage?.projectsLimit || 1}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Workspaces</span>
            <span>{planLimits.workspacesLimit}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">IDE Sessions</span>
            <span>{planLimits.ideSessionsLimit}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Compute Credits/mo</span>
            <span>{formatNumber(planLimits.computeCreditsMonthly)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Storage</span>
            <span>{formatBytes(planLimits.storageLimit)}</span>
          </div>
        </div>
      </div>

      {/* Cloud Storage Links */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h2 className="font-semibold mb-4">Cloud Storage</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link 
            href="/dashboard/settings/byoc" 
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Database size={20} className="text-blue-400" />
            <div>
              <div className="font-medium">Connect Storage</div>
              <div className="text-xs text-white/50">Use your own S3, GCS, or R2</div>
            </div>
          </Link>
          <Link 
            href="/settings/billing" 
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <CreditCard size={20} className="text-green-400" />
            <div>
              <div className="font-medium">Billing & Invoices</div>
              <div className="text-xs text-white/50">Manage payment methods</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Upgrade prompt if low limits */}
      {usage && (
        (getPercentage(usage.aiTokensUsed, usage.aiTokensMonthly) >= 75 || 
        getPercentage(usage.apiCallsUsed, usage.apiCallsMonthly) >= 75) && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-1">Usage Warning</h3>
                <p className="text-sm text-white/70 mb-2">
                  You've used over 75% of your monthly {usage.aiTokensMonthly >= usage.apiCallsMonthly ? "AI tokens" : "API calls"}. 
                  Upgrade to Pro for more resources.
                </p>
                <Link href="/subscription" className="text-sm text-yellow-400 hover:underline">
                  Upgrade now →
                </Link>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}