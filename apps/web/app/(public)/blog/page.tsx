"use client";

import { useMemo, useState } from "react";
import { Calendar, Filter, Search, Tag } from "lucide-react";

type Post = {
  title: string;
  date: string;
  category: string;
  summary: string;
  readTime: string;
};

const posts: Post[] = [
  {
    title: "Designing a chat-first Playground",
    date: "2025-01-05",
    category: "Product",
    summary: "How we rebuilt the Playground to keep prompts, outputs, and contextual tools in a single loop.",
    readTime: "6 min",
  },
  {
    title: "Wonder-Build: prompts to components",
    date: "2024-12-15",
    category: "Engineering",
    summary: "Inside our prompt-to-component pipeline, with safety checks and live preview guards.",
    readTime: "7 min",
  },
  {
    title: "Evaluating agents with live telemetry",
    date: "2024-11-20",
    category: "AI",
    summary: "How we score agent steps, detect regressions, and surface actionable logs.",
    readTime: "5 min",
  },
  {
    title: "Building calm UX for AI creation",
    date: "2024-10-10",
    category: "Design",
    summary: "Principles we use to avoid dashboard clutter while keeping power features close.",
    readTime: "4 min",
  },
];

const categories = ["All", "Product", "Engineering", "AI", "Design"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      const matchesSearch =
        !search.trim() ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.summary.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI Wonderland</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Blog & Updates</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Product releases, engineering deep dives, and design principles for calm AI experiences.
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-3 sm:grid-cols-[1.4fr,1fr]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-inner shadow-sky-500/5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts"
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-sky-500/5">
            <Filter className="h-4 w-4 text-slate-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  activeCategory === cat
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
          {filtered.map((post) => (
            <article
              key={post.title}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/40"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-slate-200">
                  <Tag className="h-3.5 w-3.5" />
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-slate-200">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.date).toLocaleDateString()}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-slate-200">{post.readTime} read</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-50">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{post.summary}</p>
              <div className="mt-3 text-sm text-sky-200">Coming soon: full post</div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
              No posts match your filters. Try clearing the search or switching categories.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
