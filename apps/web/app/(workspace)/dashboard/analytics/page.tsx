"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AnalyticsData {
  totalProjects: number;
  totalStorage: number;
  apiCalls: number;
  runtimeHours: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function fetchAnalytics() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: projects } = await supabase
          .from("projects")
          .select("id, storage_used, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString());

        const { data: apiLogs } = await supabase
          .from("api_logs")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString());

        const totalStorage = projects?.reduce((sum, p) => sum + (p.storage_used || 0), 0) || 0;

        setData({
          totalProjects: projects?.length || 0,
          totalStorage,
          apiCalls: apiLogs?.length || 0,
          runtimeHours: Math.floor((apiLogs?.length || 0) * 0.1)
        });
      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>
        <div className="animate-pulse text-white/50">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="text-white/50 text-sm">Total Projects</div>
          <div className="text-3xl font-bold mt-1">{data?.totalProjects || 0}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="text-white/50 text-sm">Storage Used</div>
          <div className="text-3xl font-bold mt-1">
            {data ? (data.totalStorage / 1024 / 1024).toFixed(1) : 0} MB
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="text-white/50 text-sm">API Calls</div>
          <div className="text-3xl font-bold mt-1">{data?.apiCalls || 0}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="text-white/50 text-sm">Runtime Hours</div>
          <div className="text-3xl font-bold mt-1">{data?.runtimeHours || 0}h</div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <h2 className="text-xl font-bold mb-4">Usage Over Time</h2>
        {data && data.totalProjects > 0 ? (
          <div className="h-48 flex items-end gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 bg-blue-500/50 rounded-t" style={{ height: `${Math.random() * 100}%` }} />
            ))}
          </div>
        ) : (
          <div className="text-white/50 text-center py-8">
            No usage data yet. <Link href="/dashboard" className="text-blue-400 hover:underline">Create a project</Link> to get started.
          </div>
        )}
      </div>
    </div>
  );
}