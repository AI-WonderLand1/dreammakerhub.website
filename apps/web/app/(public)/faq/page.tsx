"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Search, Filter, Sparkles } from "lucide-react";

type Faq = { question: string; answer: string; category: string };

const faqs: Faq[] = [
  {
    question: "How do I start a Playground session?",
    answer:
      "Open /playground, pick a module, and type your prompt. Advanced parameters stay tucked away until you toggle them on.",
    category: "Product",
  },
  {
    question: "Can I undo changes applied to a project?",
    answer:
      "Yes. Each apply action captures a snapshot. Use the project actions drawer in Playground or the dashboard to restore.",
    category: "Product",
  },
  {
    question: "How does billing work?",
    answer:
      "Personal includes Playground, Wonder-Build, and publishing limits suitable for small teams. Enterprise unlocks unlimited modules, extensions, and domain controls.",
    category: "Billing",
  },
  {
    question: "Do you store my prompts and outputs?",
    answer:
      "We retain prompts and outputs only for session continuity and debugging. You can request deletion via support, and enterprise tenants can disable retention.",
    category: "Security",
  },
  {
    question: "Which models are supported?",
    answer:
      "Claude Sonnet 4 powers chat, code, agent, and vision-planning modules today. We add models behind feature flags before general release.",
    category: "Product",
  },
  {
    question: "How do I report a security issue?",
    answer: "Email security@ai-wonderland.com with details and steps to reproduce. We respond within one business day.",
    category: "Security",
  },
];

const categories = ["All", "Product", "Billing", "Security"];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return faqs.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !search.trim() ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">WONDERSPACE</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">FAQ</h1>
          <p className="max-w-2xl text-slate-300">Answers to the most common product, billing, and security questions.</p>
        </header>

        <div className="mt-8 grid gap-3 sm:grid-cols-[1.4fr,1fr]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-inner shadow-sky-500/5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions"
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-sky-500/5">
            <Filter className="h-4 w-4 text-slate-400" />
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

        <div className="mt-6 space-y-4">
          {filtered.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/40"
            >
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HelpCircle className="h-4 w-4 text-sky-300" />
                <span>{item.category}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">{item.question}</h2>
              <p className="mt-2 text-sm text-slate-300">{item.answer}</p>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
              No answers match your filters. Try a different keyword.
            </div>
          )}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Need more?</p>
              <h2 className="text-xl font-semibold text-slate-50">Talk to support</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Open a ticket at /support for account, billing, or product questions. We respond within one business day.
          </p>
        </div>
      </div>
    </div>
  );
}
