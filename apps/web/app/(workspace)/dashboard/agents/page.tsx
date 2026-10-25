"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { ensureSupabaseConfig, getSupabaseClient } from "@/lib/supabase/client";

type WorkspaceAgent = { id: string; name: string; persona: string | null; is_active: boolean };
type LibraryStatus = "loading" | "ready" | "signed-out" | "error";

export default function AgentsPage() {
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>("loading");
  const [libraryError, setLibraryError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await ensureSupabaseConfig();
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Account authentication is not configured.");
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) {
          if (active) setLibraryStatus("signed-out");
          return;
        }
        // RLS restricts this user-owned library; do not use service-role access.
        const { data, error } = await supabase.from("swarm_agents")
          .select("id,name,persona,is_active")
          .eq("owner_id", auth.user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        if (active) {
          setAgents((data || []) as WorkspaceAgent[]);
          setLibraryStatus("ready");
        }
      } catch (cause) {
        if (active) {
          setLibraryError(cause instanceof Error ? cause.message : "Unable to load saved agents.");
          setLibraryStatus("error");
        }
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <main className="space-y-5">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Agents" }]} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AI WONDERLAND Agents</h1>
            <p className="mt-1 text-sm text-white/60">Your saved agents and configuration in one dashboard.</p>
          </div>
          <Link href="/dashboard/settings/agents" className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20">
            Agent Settings
          </Link>
        </div>
      </header>

      <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/50 p-5" aria-live="polite">
        <h2 className="text-xl font-bold text-white">My agents</h2>
        <p className="mt-2 text-sm text-white/65">Agents saved to your AI WONDERLAND workspace. Only agents returned for your account are shown.</p>
        {libraryStatus === "loading" && <p className="mt-6 text-sm text-white/60" role="status">Loading your agents…</p>}
        {libraryStatus === "signed-out" && <p className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">Sign in to view your saved agents.</p>}
        {libraryStatus === "error" && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">{libraryError}</p>}
        {libraryStatus === "ready" && (agents.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {agents.map((agent) => <article key={agent.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">{agent.name}</h3>
                <span className={`rounded-full px-2 py-1 text-[11px] ${agent.is_active ? "bg-emerald-400/10 text-emerald-200" : "bg-white/10 text-white/60"}`}>{agent.is_active ? "Active" : "Inactive"}</span>
              </div>
              {agent.persona && <p className="mt-2 text-sm text-white/60">{agent.persona}</p>}
            </article>)}
          </div>
        ) : <p className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/65">No workspace agents have been saved to this account.</p>)}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://playground.dreammakerhub.website/node-builder" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
            Create an agent node in Playground
          </a>
          <Link href="/dashboard/projects" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
            View projects
          </Link>
        </div>
        <p className="mt-5 text-xs leading-5 text-amber-100/75">Playground-saved node agents use a separate library backend and are not yet synced to this workspace. Existing records remain untouched.</p>
      </section>
    </main>
  );
}
