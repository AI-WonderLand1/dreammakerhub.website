"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import WonderSpaceProjectNavigation from "@/components/dashboard/WonderSpaceProjectNavigation";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { useProjectRealtimeInvalidation } from "@/lib/wonderspace/use-project-realtime-invalidation";

export default function ProjectWikiPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [projectName, setProjectName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const url = `/api/projects/${encodeURIComponent(projectId)}/wiki`;

  const reloadWiki = async () => {
    const wikiRes = await fetchAuthenticatedProject(url);
    const wiki = await wikiRes.json().catch(() => null);
    if (!wikiRes.ok) throw new Error(wiki?.error || "Unable to refresh wiki.");
    if (!dirty) setContent(typeof wiki?.content === "string" ? wiki.content : "");
  };

  const announceWikiChange = useProjectRealtimeInvalidation(projectId, "wiki", () => {
    if (!dirty) void reloadWiki();
  });

  useEffect(() => {
    let live = true;
    void Promise.all([
      fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}`),
      fetchAuthenticatedProject(url),
    ]).then(async ([projectRes, wikiRes]) => {
      const project = await projectRes.json().catch(() => null);
      const wiki = await wikiRes.json().catch(() => null);
      if (!projectRes.ok || !wikiRes.ok) throw new Error(wiki?.error || project?.message || "Unable to load wiki.");
      if (live) {
        setProjectName(typeof project?.project?.name === "string" ? project.project.name : "Project");
        setContent(typeof wiki?.content === "string" ? wiki.content : "");
        setDirty(false);
      }
    }).catch(caught => {
      if (live) setMessage(caught instanceof Error ? caught.message : "Unable to load wiki.");
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [projectId, url]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !dirty) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetchAuthenticatedProject(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.saved) throw new Error(data?.error || "Unable to save wiki.");
      setDirty(false);
      setMessage("Saved to your DreamMakerHub project.");
      await announceWikiChange();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to save wiki.");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 text-white">
      <div className="flex gap-2 text-xs text-slate-400">
        <Link href="/dashboard" className="hover:text-cyan-300">Workspace</Link><span>/</span>
        <Link href={`/dashboard/projects/${encodeURIComponent(projectId)}`} className="hover:text-cyan-300">{projectName || "Project"}</Link>
        <span>/</span><span className="text-white">Wiki</span>
      </div>
      <WonderSpaceProjectNavigation projectId={projectId} active="wiki" />
      <section className="rounded-xl border border-white/10 bg-[#0d1729] p-5">
        <h1 className="text-xl font-bold">Project Wiki</h1>
        <p className="mt-2 text-sm text-slate-400">Your project's own Markdown documentation. Stored privately with its files, not hosted by GitHub.</p>
        {loading ? <p role="status" className="mt-4 text-sm text-slate-400">Loading wiki…</p> : (
          <form onSubmit={event => void save(event)} className="mt-5 space-y-3">
            <label htmlFor="wonder-wiki-content" className="block text-sm font-semibold">Wiki home page (Markdown)</label>
            <textarea id="wonder-wiki-content" rows={18} maxLength={30000} value={content}
              onChange={event => { setContent(event.target.value); setDirty(true); setMessage(""); }}
              placeholder="# Project documentation\n\nDescribe your project here."
              className="w-full resize-y rounded-xl border border-white/20 bg-[#07101e] p-4 font-mono text-sm leading-6 outline-none focus:border-cyan-400" />
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving || !dirty} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                {saving ? "Saving…" : "Save wiki"}
              </button>
              {dirty && <span className="text-xs text-amber-200">Unsaved changes</span>}
            </div>
          </form>
        )}
        {message && <p role="status" className="mt-3 text-sm text-cyan-200">{message}</p>}
      </section>
    </div>
  );
}
