"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";
import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";

type Option = {
  id: string;
  name: string;
  summary: string;
  status: "ready" | "beta";
  href: string;
};

type CatalogResponse = {
  ai: Option[];
  agents: Option[];
  runners: Option[];
  workers: Option[];
};

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function OptionCard({ option }: { option: Option }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{option.name}</h3>
          <p className="mt-1 text-sm text-white/65">{option.summary}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
            option.status === "ready"
              ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
              : "border border-amber-400/25 bg-amber-500/10 text-amber-200"
          }`}
        >
          {option.status}
        </span>
      </div>

      <div className="mt-3">
        <Link
          href={option.href}
          className="inline-flex h-9 items-center rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white/85 hover:bg-white/15"
        >
          Open
        </Link>
      </div>
    </article>
  );
}

export default function AgentsPage() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/platform/options", { method: "GET" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to load options (${res.status})`);
      }
      const data = (await res.json()) as CatalogResponse;
      const total = data.ai.length + data.agents.length + data.runners.length + data.workers.length;
      if (!total) {
        pushToast("No platform options available yet.", "success");
      }
      setCatalog(data);
    } catch (error: any) {
      const message = error?.message ?? "Failed to load options";
      setErr(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const sections = useMemo(
    () => [
      { key: "ai", title: "AI Options", data: catalog?.ai ?? [] },
      { key: "agents", title: "Agent Options", data: catalog?.agents ?? [] },
      { key: "runners", title: "Runner Options", data: catalog?.runners ?? [] },
      { key: "workers", title: "Worker Options", data: catalog?.workers ?? [] },
    ],
    [catalog],
  );

  const isEmpty = !loading && !err && sections.every((section) => section.data.length === 0);

  return (
    <div className="space-y-4">
      <ToastStack toasts={toasts} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "AI & Agents" }]} />
            <h2 className="mt-2 text-2xl font-bold">AI, Agents, Runners & Workers</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/65">
              Choose the execution layer you need: model orchestration, autonomous agents, server runners, or background workers.
            </p>
          </div>
          <Link
            href="/ai-modules"
            className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 text-sm font-bold"
          >
            Open AI Modules
          </Link>
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
          <p>{err}</p>
          <button
            type="button"
            onClick={loadCatalog}
            className="mt-2 rounded-md border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <SkeletonGrid cards={4} />
      ) : isEmpty ? (
        <EmptyState
          title="No options available"
          description="We could not find AI, agent, runner, or worker options. Reload or open AI modules directly."
          cta={
            <button
              type="button"
              onClick={loadCatalog}
              className="inline-flex h-10 items-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/90"
            >
              Reload Catalog
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-wider text-white/60">{section.title}</div>
              <div className="space-y-3">
                {section.data.map((item) => (
                  <OptionCard key={item.id} option={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
