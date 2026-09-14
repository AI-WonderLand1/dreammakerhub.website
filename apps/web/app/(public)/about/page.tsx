"use client";

import { Sparkles, Target, Users, Rocket, Compass, ShieldCheck, HeartHandshake } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Build with clarity",
    description: "Bring AI, visual building, code, and 3D workflows into one place instead of scattering a project across disconnected tools.",
  },
  {
    icon: ShieldCheck,
    title: "Be honest about readiness",
    description: "DreamMakerHub is under active development. We distinguish working features from experiments and planned capabilities.",
  },
  {
    icon: HeartHandshake,
    title: "Make creation accessible",
    description: "The platform is being designed for creators who want powerful tools without needing a large engineering team.",
  },
];

const products = [
  {
    title: "WonderBuild",
    detail: "AI-assisted and visual website/app building with editing and preview workflows.",
  },
  {
    title: "AI Playground",
    detail: "A workspace for exploring AI models, providers, prompts, tools, and orchestration workflows.",
  },
  {
    title: "NPC-AI-SIM",
    detail: "An experimental environment for building AI-driven characters with memory, perception, actions, and cognition controls.",
  },
  {
    title: "WonderSpace",
    detail: "Cloud development workspace work focused on browser-based coding and project environments.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI WONDERLAND INNOVATION</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">About DreamMakerHub</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              DreamMakerHub is an independent software project focused on bringing AI-assisted web, app, cloud development,
              and interactive 3D creation into one platform.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
            <Compass className="h-4 w-4" />
            Independent and actively developed
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Target className="h-5 w-5 text-sky-300" />
              <span>Our mission</span>
            </div>
            <p className="mt-3 text-xl font-semibold text-slate-50">
              Make advanced creation tools easier to use without hiding what the technology is actually doing.
            </p>
            <p className="mt-3 text-slate-300">
              The goal is a practical workflow where a creator can start an idea, use AI where it helps, edit the result,
              work with real project files, and move toward publishing from the same ecosystem.
            </p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-inner shadow-sky-500/10">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Rocket className="h-5 w-5 text-sky-300" />
              <span>Current focus</span>
            </div>
            <ul className="mt-4 space-y-3 text-slate-200">
              <li>AI-assisted visual building.</li>
              <li>Cloud development environments.</li>
              <li>Model and provider workflows.</li>
              <li>3D creation and AI character systems.</li>
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
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Products & systems</p>
            <h2 className="text-2xl font-semibold text-slate-50">What is being built</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {products.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-lg font-semibold text-slate-50">{item.title}</p>
                <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/5 bg-slate-950/70 p-6 shadow-inner shadow-sky-500/5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">How we build</p>
              <h2 className="text-2xl font-semibold text-slate-50">Founder-led, independent development</h2>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-slate-300">
            AI WONDERLAND INNOVATION is currently a founder-led independent project. DreamMakerHub and its related systems
            are being developed iteratively, with features at different stages of testing and readiness. We do not present
            placeholder team members or unfinished systems as established production capabilities.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sky-200 hover:text-sky-100" href="/docs">
              Read the documentation
            </a>
            <a className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sky-200 hover:text-sky-100" href="/contact">
              Contact AI WONDERLAND INNOVATION
            </a>
            <a
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sky-200 hover:text-sky-100"
              href="https://github.com/AI-WonderLand1"
              target="_blank"
              rel="noreferrer"
            >
              View GitHub
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
