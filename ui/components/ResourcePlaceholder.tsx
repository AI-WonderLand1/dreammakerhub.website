"use client";

import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

type ResourcePlaceholderProps = {
  title: string;
  description: string;
  status?: "404" | "coming-soon";
  highlights?: { label: string; detail?: string }[];
  primaryHref?: string;
  primaryLabel?: string;
};

export default function ResourcePlaceholder({
  title,
  description,
  status = "404",
  highlights,
  primaryHref = "/",
  primaryLabel = "Return home",
}: ResourcePlaceholderProps) {
  const badgeCopy = status === "404" ? "Not found" : "Coming soon";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-lg font-bold text-sky-200 shadow-inner shadow-sky-500/10">
              ✶
            </span>
            <span>AI-Wonderland</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 hover:border-sky-400/50 hover:bg-sky-500/10"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </header>

        <main className="mt-12 flex-1">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-x-10 top-6 h-32 rounded-3xl bg-gradient-to-r from-sky-500/15 via-purple-500/10 to-transparent blur-3xl" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]" />
                {badgeCopy}
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">{title}</h1>
                <p className="max-w-2xl text-base text-slate-300 sm:text-lg">{description}</p>
              </div>

              {highlights && highlights.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 shadow-inner shadow-sky-500/5"
                    >
                      <div className="flex items-center gap-2 text-sky-200">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      {item.detail && <p className="mt-2 text-slate-400">{item.detail}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500/80 via-sky-400/80 to-violet-500/70 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition hover:scale-[1.01] hover:shadow-[0_14px_45px_rgba(124,58,237,0.25)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {primaryLabel}
                </Link>
                <span className="text-xs text-slate-400">We’ll light this space up soon.</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
