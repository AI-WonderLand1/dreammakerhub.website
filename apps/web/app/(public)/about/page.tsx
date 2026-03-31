"use client";

import { Sparkles, Target, Users, Rocket, Compass, ShieldCheck, HeartHandshake } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Invent with clarity",
    description: "We design calm, intentional tools so teams can move from prompt to product without noise.",
  },
  {
    icon: ShieldCheck,
    title: "Ship responsibly",
    description: "Guardrails, observability, and reversible changes keep experimentation safe by default.",
  },
  {
    icon: HeartHandshake,
    title: "Build together",
    description: "AI Wonderland is collaborative by design—projects, playbooks, and modules are meant to be shared.",
  },
];

const milestones = [
  { label: "Q1 2025", title: "Playground revamp", detail: "Progressive chat-first flows with contextual tools." },
  { label: "Q2 2025", title: "Wonder-Build launch", detail: "Visual builder that turns prompts into components." },
  { label: "Q3 2025", title: "Modules marketplace", detail: "Curated AI skills you can mix, match, and deploy." },
  { label: "Q4 2025", title: "Team workspace", detail: "Shared environments with versioned outputs and review." },
];

const team = [
  { name: "Avery Chen", role: "Founder & Product", focus: "Designing calm AI-first workflows" },
  { name: "Jordan Patel", role: "Engineering Lead", focus: "Runtime, safety, and observability" },
  { name: "Samira Lopez", role: "AI Systems", focus: "Model orchestration and evaluation" },
  { name: "Mina Okafor", role: "Developer Experience", focus: "Docs, starter kits, and support" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI-WONDERLAND</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">About</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              We’re building an intelligent, exploratory platform where teams can design, test, and ship AI-driven
              experiences with confidence.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
            <Compass className="h-4 w-4" />
            Future-facing. Calm by design.
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Target className="h-5 w-5 text-sky-300" />
              <span>Our mission</span>
            </div>
            <p className="mt-3 text-xl font-semibold text-slate-50">
              Help builders move from idea to deployed AI experience with the least friction—and the most safety.
            </p>
            <p className="mt-3 text-slate-300">
              AI Wonderland unifies prompt experimentation, component generation, and deployment in a single flow. We keep
              context alive, expose guardrails, and ensure you can undo every change.
            </p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-inner shadow-sky-500/10">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Rocket className="h-5 w-5 text-sky-300" />
              <span>What we’re shipping</span>
            </div>
            <ul className="mt-4 space-y-3 text-slate-200">
              <li>Playground: chat-first exploration with contextual tools.</li>
              <li>Wonder-Build: prompt-to-component builder with live preview.</li>
              <li>Modules: reusable AI skills for chat, code, data, agents, and vision.</li>
              <li>Workspaces: shared environments with snapshots, publish, and domains.</li>
            </ul>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-inner shadow-sky-500/5"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-sky-200">
                <Icon className="h-4 w-4" />
                {title}
              </div>
              <p className="mt-3 text-sm text-slate-300">{description}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Roadmap</p>
              <h2 className="text-2xl font-semibold text-slate-50">Milestones</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {milestones.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs text-sky-300">{item.label}</p>
                <p className="text-lg font-semibold text-slate-50">{item.title}</p>
                <p className="text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/5 bg-slate-950/70 p-6 shadow-inner shadow-sky-500/5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Team</p>
              <h2 className="text-2xl font-semibold text-slate-50">People building AI Wonderland</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-sm font-semibold text-slate-50">{member.name}</p>
                <p className="text-xs text-slate-400">{member.role}</p>
                <p className="mt-2 text-sm text-slate-300">{member.focus}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
