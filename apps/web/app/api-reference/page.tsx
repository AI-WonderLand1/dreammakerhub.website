"use client";

import { useMemo, useState } from "react";
import { Search, BookOpen, Code, Server, Link as LinkIcon } from "lucide-react";

type Endpoint = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  group: string;
  description: string;
  example: string;
};

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/projects",
    group: "Projects",
    description: "List projects the current user can access.",
    example: `curl -X GET https://ai-wonderland.app/api/projects \\
  -H "Authorization: Bearer <token>"`,
  },
  {
    method: "POST",
    path: "/api/projects",
    group: "Projects",
    description: "Create a new project.",
    example: `curl -X POST https://ai-wonderland.app/api/projects \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My Project"}'`,
  },
  {
    method: "POST",
    path: "/api/playground/run",
    group: "Playground",
    description: "Execute a Playground module (chat, code, agent, data, vision).",
    example: `curl -X POST https://ai-wonderland.app/api/playground/run \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "moduleId": "chat",
    "mode": "test",
    "prompt": "Summarize today's updates"
  }'`,
  },
  {
    method: "POST",
    path: "/api/projects/{projectId}/publish",
    group: "Publish",
    description: "Publish the latest build artifacts for a project.",
    example: `curl -X POST https://ai-wonderland.app/api/projects/123/publish \\
  -H "Authorization: Bearer <token>"`,
  },
  {
    method: "POST",
    path: "/api/projects/{projectId}/snapshots/restore",
    group: "Snapshots",
    description: "Restore the most recent snapshot.",
    example: `curl -X POST https://ai-wonderland.app/api/projects/123/snapshots/restore \\
  -H "Authorization: Bearer <token>"`,
  },
];

const methodColors: Record<Endpoint["method"], string> = {
  GET: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  POST: "bg-sky-500/20 text-sky-200 border-sky-500/40",
  DELETE: "bg-rose-500/20 text-rose-200 border-rose-500/40",
};

export default function ApiReferencePage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      const query = search.toLowerCase();
      return (
        ep.path.toLowerCase().includes(query) ||
        ep.description.toLowerCase().includes(query) ||
        ep.group.toLowerCase().includes(query)
      );
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">API Reference</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              Build on AI Wonderland
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              REST endpoints for projects, Playground runs, publishing, and snapshots. Auth via Bearer tokens.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
            <Server className="h-4 w-4" />
            api.wonderland
          </div>
        </header>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-inner shadow-sky-500/5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints by path, group, or description"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((ep) => (
            <div
              key={ep.path + ep.method}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${methodColors[ep.method]}`}>
                      {ep.method}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-200">{ep.group}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-50">{ep.path}</p>
                  <p className="text-sm text-slate-300">{ep.description}</p>
                </div>
                <LinkIcon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-100">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Code className="h-4 w-4" />
                  <span>Example request</span>
                </div>
                <pre className="whitespace-pre-wrap">{ep.example}</pre>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
              No endpoints match your search. Try a different keyword.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
