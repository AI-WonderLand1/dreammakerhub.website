"use client";

import { PlayCircle, Timer, Sparkles, BookOpen } from "lucide-react";

type Tutorial = {
  title: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  link: string;
};

const tutorials: Tutorial[] = [
  {
    title: "Chat-first Playground in 10 minutes",
    duration: "10 min",
    level: "Beginner",
    summary: "Run your first chat and code modules, keep outputs in context, and re-run without losing state.",
    link: "/docs",
  },
  {
    title: "Prompt-to-component with Wonder-Build",
    duration: "18 min",
    level: "Intermediate",
    summary: "Turn prompts into UI blocks, refine with drag-and-drop, and publish a preview safely.",
    link: "/wonderspace",
  },
  {
    title: "Guardrails and rollback for apply",
    duration: "15 min",
    level: "Advanced",
    summary: "Capture snapshots, apply changes to projects, and restore instantly when reviewing.",
    link: "/support",
  },
];

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI-WONDERLAND</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Tutorials</h1>
          <p className="max-w-2xl text-slate-300">
            Quick guides for launching Playground sessions, building with Wonder-Build, and keeping changes safe.
          </p>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <article
              key={tutorial.title}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/40"
            >
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Timer className="h-4 w-4 text-sky-300" />
                <span>{tutorial.duration}</span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-200">{tutorial.level}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">{tutorial.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{tutorial.summary}</p>
              <a className="mt-3 inline-flex items-center gap-2 text-sm text-sky-200 hover:text-sky-100" href={tutorial.link}>
                <PlayCircle className="h-4 w-4" />
                View guide
              </a>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-inner shadow-sky-500/5">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Want something deeper?</p>
              <h2 className="text-xl font-semibold text-slate-50">Explore the docs</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            The documentation covers API details, module behaviors, and deployment workflows. Check it out while we add
            more guided videos.
          </p>
          <a className="mt-3 inline-flex items-center gap-2 text-sm text-sky-200 hover:text-sky-100" href="/docs">
            <Sparkles className="h-4 w-4" />
            Read documentation
          </a>
        </div>
      </div>
    </div>
  );
}
