"use client";

import { Briefcase, MapPin, CheckCircle, Rocket, Mail } from "lucide-react";

type Role = {
  title: string;
  location: string;
  type: string;
  focus: string;
};

const roles: Role[] = [
  {
    title: "Senior Full-Stack Engineer",
    location: "Remote-first (Americas/Europe)",
    type: "Full-time",
    focus: "Runtime, safety, and AI-assisted builder flows",
  },
  {
    title: "Product Designer, AI UX",
    location: "Remote-first",
    type: "Full-time",
    focus: "Calm, progressive-disclosure interfaces across Playground and Wonder-Build",
  },
  {
    title: "Developer Relations Lead",
    location: "Remote-first",
    type: "Full-time",
    focus: "Docs, starter kits, and community programs for AI builders",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI-WONDERLAND</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Join the team</h1>
          <p className="max-w-2xl text-slate-300">
            We’re building calm, production-grade tools for teams shipping AI experiences. If you care about
            reliability, safety, and delightful UX, we’d love to talk.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Rocket className="h-4 w-4 text-sky-300" />
              Ship fast, safely
            </div>
            <p className="mt-2 text-sm text-slate-300">Guardrails, observability, and reversible changes by default.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <CheckCircle className="h-4 w-4 text-sky-300" />
              Build together
            </div>
            <p className="mt-2 text-sm text-slate-300">Cross-functional squads across product, design, and systems.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Briefcase className="h-4 w-4 text-sky-300" />
              Remote-first
            </div>
            <p className="mt-2 text-sm text-slate-300">Global-first processes with async collaboration norms.</p>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Open roles</p>
              <h2 className="text-2xl font-semibold text-slate-50">Current openings</h2>
            </div>
          </div>
          <div className="grid gap-4">
            {roles.map((role) => (
              <div key={role.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-slate-50">{role.title}</p>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">{role.type}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{role.location}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{role.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">How to apply</p>
              <h2 className="text-xl font-semibold text-slate-50">Tell us about your work</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Email careers@ai-wonderland.com with a brief note, links to shipped work, and why you want to build calm AI
            tools. We review every application.
          </p>
        </section>
      </div>
    </div>
  );
}
