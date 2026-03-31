"use client";

import { Calendar, Users, MessageSquare, Sparkles, Link as LinkIcon } from "lucide-react";

const channels = [
  { label: "Builders Forum", detail: "Deep dives, design critiques, and implementation threads.", cta: "Open forum", href: "/support" },
  { label: "Release Notes", detail: "Follow product drops and UX changes every week.", cta: "View updates", href: "/blog" },
  { label: "Office Hours", detail: "Live support for Playground and Wonder-Build flows.", cta: "Book a slot", href: "/support" },
];

const events = [
  { title: "Playground power users", date: "Monthly", focus: "Share prompt patterns and contextual tool setups." },
  { title: "Wonder-Build lab", date: "Bi-weekly", focus: "Co-build components and review deployment workflows." },
  { title: "AI safety clinic", date: "Quarterly", focus: "Guardrails, observability, and reversible changes." },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI-WONDERLAND</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Community</h1>
          <p className="max-w-2xl text-slate-300">
            Meet the builders shaping calm, production-grade AI experiences. Join sessions, share patterns, and ship
            together.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              className="group rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5 transition hover:border-sky-400/50"
            >
              <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-sky-200">
                  <Users className="h-4 w-4" />
                  {channel.label}
                </div>
                <LinkIcon className="h-4 w-4 text-slate-500 group-hover:text-sky-300" />
              </div>
              <p className="mt-3 text-sm text-slate-300">{channel.detail}</p>
              <div className="mt-3 text-xs text-sky-200">{channel.cta}</div>
            </a>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Gatherings</p>
              <h2 className="text-2xl font-semibold text-slate-50">Sessions we run</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {events.map((event) => (
              <div key={event.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MessageSquare className="h-4 w-4 text-sky-300" />
                  <span>{event.date}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-50">{event.title}</p>
                <p className="mt-2 text-sm text-slate-300">{event.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-inner shadow-sky-500/5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Share what you’re building</p>
              <h2 className="text-xl font-semibold text-slate-50">Bring your work to show-and-tell</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Have a pattern to share? Drop a note in the forum or tag a post in the release notes thread—we highlight
            standout builds every month.
          </p>
        </section>
      </div>
    </div>
  );
}
