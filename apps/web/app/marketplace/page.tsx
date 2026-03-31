"use client";

import { Plug, ShieldCheck, Sparkles, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Extension = {
  name: string;
  category: string;
  description: string;
  status: "available" | "beta";
};

const extensions: Extension[] = [
  {
    name: "Changelog Writer",
    category: "Productivity",
    description: "Turn diffs into release notes with tone controls and approval steps.",
    status: "available",
  },
  {
    name: "Schema Guard",
    category: "Governance",
    description: "Validate migrations and enforce data rules before deploys.",
    status: "available",
  },
  {
    name: "Telemetry Lens",
    category: "Observability",
    description: "Stream model traces, token usage, and guardrail hits into your dashboard.",
    status: "beta",
  },
  {
    name: "Content Safety",
    category: "Governance",
    description: "Screen prompts and outputs with configurable policies.",
    status: "beta",
  },
];

const categories = ["All", "Productivity", "Governance", "Observability"];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return extensions.filter((ext) => {
      const matchesCategory = category === "All" || ext.category === category;
      const matchesSearch =
        !search.trim() ||
        ext.name.toLowerCase().includes(search.toLowerCase()) ||
        ext.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI-WONDERLAND</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Marketplace</h1>
          <p className="max-w-3xl text-slate-300">
            Curated extensions that plug into Playground and Wonder-Build. Governed installs, clear scopes, and
            reversible changes.
          </p>
        </header>

        <div className="mt-8 grid gap-3 sm:grid-cols-[1.4fr,1fr]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-inner shadow-sky-500/5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search extensions"
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-sky-500/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  category === cat
                    ? "bg-gradient-to-r from-sky-500/80 to-violet-500/70 text-slate-950 shadow-[0_10px_30px_rgba(56,189,248,0.25)]"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:border-sky-400/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((ext) => (
            <div
              key={ext.name}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-slate-50">{ext.name}</p>
                  <p className="text-xs text-slate-400">{ext.category}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] ${
                    ext.status === "available"
                      ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-200 border border-amber-500/30"
                  }`}
                >
                  {ext.status === "available" ? "Available" : "Beta"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{ext.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  <Plug className="h-3.5 w-3.5" />
                  Works with Playground
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Wonder-Build ready
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Scoped access
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
              No extensions match your filters. Try a different keyword.
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-inner shadow-sky-500/5">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Install flow</p>
              <h2 className="text-xl font-semibold text-slate-50">Governed from start to finish</h2>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Review scopes and required secrets before installing.</li>
            <li>Per-project toggles and removal without residue.</li>
            <li>Audit logs for installs, updates, and removals.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
