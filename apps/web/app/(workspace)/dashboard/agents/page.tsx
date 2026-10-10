"use client";

import Link from "next/link";
import { useState } from "react";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";

type View = "sessions" | "attention";
export default function AgentsPage() {
  const [view, setView] = useState<View>("sessions");

  return (
    <main className="space-y-5">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Agents" }]} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AI WONDERLAND Agents</h1>
            <p className="mt-1 text-sm text-white/60">Manage agent sessions and configuration across your workspace.</p>
          </div>
          <Link href="/dashboard/settings/agents" className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20">
            Configure agents
          </Link>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Agent management" className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 lg:min-h-[520px]">
          <button type="button" aria-current={view === "sessions" ? "page" : undefined} onClick={() => setView("sessions")} className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition ${view === "sessions" ? "border-l-2 border-cyan-400 bg-white/15 text-white" : "text-white/70 hover:bg-white/10"}`}>
            My sessions
          </button>
          <button type="button" aria-current={view === "attention" ? "page" : undefined} onClick={() => setView("attention")} className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition ${view === "attention" ? "border-l-2 border-cyan-400 bg-white/15 text-white" : "text-white/70 hover:bg-white/10"}`}>
            Needs attention
          </button>
          <div className="my-3 border-t border-white/10" />
          <Link href="/dashboard/settings/agents" className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">Agent settings</Link>
          <Link href="/dashboard/projects" className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">Connected projects</Link>
          <Link href="/dashboard" className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">Dashboard AI</Link>
        </nav>

        <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/50 p-5" aria-live="polite">
          {view === "sessions" ? (
            <>
              <h2 className="text-xl font-bold text-white">Sessions</h2>
              <p className="mt-2 text-sm text-white/65">This page does not yet have a verified agent-session history data source.</p>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <h3 className="text-lg font-semibold text-white">Agent sessions are not connected</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">Once a session API with per-user access controls is connected, active and completed agent runs can appear here. No placeholder runs or made-up counters are shown.</p>
                <Link href="/dashboard/settings/agents" className="mt-5 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Open agent configuration</Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white">Needs attention</h2>
              <p className="mt-2 text-sm text-white/65">Live agent failure and approval signals are not connected to this page yet.</p>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <h3 className="font-semibold text-white">No verified attention feed</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">This is not an all-clear status. Connect authenticated agent job and approval events before showing issue counts.</p>
                <Link href="/dashboard/aetherguard" className="mt-5 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Open security controls</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
