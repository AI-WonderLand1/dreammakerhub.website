"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleDot, MessageSquare, Plus, RefreshCw } from "lucide-react";
import WonderSpaceProjectNavigation from "./WonderSpaceProjectNavigation";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { useProjectRealtimeInvalidation } from "@/lib/wonderspace/use-project-realtime-invalidation";
import type { ProjectWorkItem, WorkItemKind } from "@/lib/wonderspace/project-work-items.server";

export default function WonderSpaceWorkItemsPanel({
  projectId, kind,
}: { projectId: string; kind: WorkItemKind }) {
  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<ProjectWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const endpoint = `/api/projects/${encodeURIComponent(projectId)}/work-items`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectRes, itemsRes] = await Promise.all([
        fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}`),
        fetchAuthenticatedProject(`${endpoint}?kind=${kind}`),
      ]);
      const [project, result] = await Promise.all([
        projectRes.json().catch(() => null), itemsRes.json().catch(() => null),
      ]);
      if (!projectRes.ok || !itemsRes.ok || !Array.isArray(result?.items)) {
        throw new Error(result?.error || project?.message || "Unable to load this project's items.");
      }
      setProjectName(typeof project?.project?.name === "string" ? project.project.name : "Project");
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load project data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, kind, projectId]);

  useEffect(() => { void load(); }, [load]);

  const announceChange = useProjectRealtimeInvalidation(
    projectId,
    kind === "issue" ? "issues" : "discussions",
    () => { void load(); },
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || !title.trim()) return;
    setSending(true); setError("");
    try {
      const response = await fetchAuthenticatedProject(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title: title.trim(), body }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.item) throw new Error(result?.error || "Unable to create item.");
      setItems(current => [result.item, ...current]);
      setTitle(""); setBody(""); setSelected(result.item.id);
      await announceChange();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create item.");
    } finally { setSending(false); }
  };

  const update = async (id: string, change: Record<string, string>) => {
    if (sending) return;
    setSending(true); setError("");
    try {
      const response = await fetchAuthenticatedProject(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, ...change }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.item) throw new Error(result?.error || "Unable to update item.");
      setItems(current => current.map(item => item.id === id ? result.item : item));
      setComment("");
      await announceChange();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update item.");
    } finally { setSending(false); }
  };

  const issue = kind === "issue";
  const Icon = issue ? CircleDot : MessageSquare;
  const titleText = issue ? "Issues" : "Discussions";
  const buttonText = issue ? "Create issue" : "Start discussion";

  return (
    <div className="min-h-[calc(100vh-4.5rem)] space-y-5 text-white">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/dashboard" className="hover:text-cyan-200">Workspace</Link>
        <span>/</span>
        <Link href={`/dashboard/projects/${encodeURIComponent(projectId)}`} className="hover:text-cyan-200">{projectName || "Project"}</Link>
        <span>/</span><span className="text-white">{titleText}</span>
      </div>
      <WonderSpaceProjectNavigation projectId={projectId} active={issue ? "issues" : "discussions"} />
      <section className="rounded-xl border border-white/10 bg-[#0d1729] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold"><Icon size={22} /> {titleText}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Saved to this AI WONDERLAND project, not an external repository.
              {issue ? " Track and close your own project issues." : " Private project discussion threads. Team access is not enabled yet."}
            </p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/5">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        <form onSubmit={event => void submit(event)} className="mt-6 space-y-3 border-t border-white/10 pt-5">
          <label htmlFor="wonder-item-title" className="block text-sm font-medium">{issue ? "New issue" : "New discussion"}</label>
          <input id="wonder-item-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={140}
            placeholder={issue ? "Describe the issue" : "Discussion topic"}
            className="w-full rounded-lg border border-white/20 bg-[#07101e] p-3 text-sm outline-none focus:border-cyan-400" />
          <label htmlFor="wonder-item-body" className="block text-xs text-slate-400">Details</label>
          <textarea id="wonder-item-body" value={body} onChange={event => setBody(event.target.value)} maxLength={10000} rows={3}
            placeholder="Add context, steps or questions…"
            className="w-full rounded-lg border border-white/20 bg-[#07101e] p-3 text-sm outline-none focus:border-cyan-400" />
          <button type="submit" disabled={sending || !title.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
            <Plus size={16} />{sending ? "Saving…" : buttonText}
          </button>
        </form>
      </section>
      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
      <section aria-label={titleText} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1729]">
        <h2 className="border-b border-white/10 px-5 py-4 text-sm font-bold">{titleText} · {items.length}</h2>
        {loading ? <p role="status" className="p-5 text-sm text-slate-400">Loading…</p> :
          items.length === 0 ? <p className="p-5 text-sm text-slate-400">No {titleText.toLowerCase()} yet.</p> :
          <ul className="divide-y divide-white/10">
            {items.map(item => (
              <li key={item.id} className="p-4">
                <button type="button" onClick={() => { setSelected(selected === item.id ? null : item.id); setComment(""); }}
                  className="flex w-full items-start gap-3 text-left">
                  <CircleDot size={18} className={item.status === "open" ? "mt-1 shrink-0 text-green-400" : "mt-1 shrink-0 text-purple-300"} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-semibold">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.status} · {new Date(item.createdAt).toLocaleDateString()} · {item.comments.length} comments</span>
                  </span>
                </button>
                {selected === item.id && (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-300">{item.body || "No description"}</p>
                    <button type="button" disabled={sending} onClick={() => void update(item.id, { status: item.status === "open" ? "closed" : "open" })}
                      className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5">
                      {item.status === "open" ? "Close" : "Reopen"}
                    </button>
                    {item.comments.map(entry => (
                      <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="whitespace-pre-wrap break-words text-sm">{entry.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    <form onSubmit={event => { event.preventDefault(); void update(item.id, { comment }); }} className="space-y-2">
                      <label htmlFor={`comment-${item.id}`} className="block text-xs text-slate-300">Add a comment</label>
                      <textarea id={`comment-${item.id}`} value={comment} onChange={event => setComment(event.target.value)} rows={2} maxLength={3000}
                        className="w-full rounded-lg border border-white/20 bg-[#07101e] p-3 text-sm" />
                      <button type="submit" disabled={sending || !comment.trim()} className="rounded-md border border-cyan-400/40 px-3 py-1.5 text-xs text-cyan-200 disabled:opacity-50">
                        Post comment
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        }
      </section>
    </div>
  );
}
