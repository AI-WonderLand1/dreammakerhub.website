"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient, ensureSupabaseConfig } from "@/lib/supabase/client";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { parseGithubRepository } from "@/lib/wonderspace/github-repository";

export default function WonderSpaceRepositoryConnection({ projectId }: { projectId: string }) {
  const [repository, setRepository] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const path = `/api/projects/${encodeURIComponent(projectId)}/github-connection`;

  useEffect(() => {
    let live = true;
    fetchAuthenticatedProject(path).then(async response => {
      if (!response.ok) throw new Error("Repository status unavailable.");
      return response.json();
    }).then(result => {
      if (!live) return;
      setRepository(parseGithubRepository(result.repository?.fullName));
    }).catch(() => { if (live) setMessage("Cannot check repository. Local files are unaffected."); });
    return () => { live = false; };
  }, [path]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const candidate = parseGithubRepository(input);
    if (!candidate) {
      setMessage("Enter a repository as owner/name or https://github.com/owner/name");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await ensureSupabaseConfig();
      const supabase = createClient();
      // The optional provider token is used once to verify a private repo.
      // It is never stored in a file or transmitted to any destination other
      // than our authenticated same-origin API and GitHub.
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const response = await fetchAuthenticatedProject(path, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.provider_token && session.user.app_metadata?.provider === "github"
            ? { "x-github-oauth-token": session.provider_token } : {}),
        },
        body: JSON.stringify({ repository: candidate }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.repository?.fullName) throw new Error(result.message || "Could not link repository.");
      setRepository(result.repository.fullName);
      window.dispatchEvent(new Event("wonderspace:github-link-updated"));
      setInput("");
      setMessage("Repository linked. Reopen this project to refresh the navigation. Files are not synced automatically.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to link repository.");
    } finally {
      setSaving(false);
    }
  }

  async function unlink() {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetchAuthenticatedProject(path, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not unlink repository.");
      setRepository(null);
      window.dispatchEvent(new Event("wonderspace:github-link-updated"));
      setMessage("Repository shortcut removed. Project files were not changed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to unlink repository.");
    } finally { setSaving(false); }
  }

  return (
    <section id="github-repository-connection" className="scroll-mt-24 rounded-xl border border-cyan-400/20 bg-[#101d2b] p-4">
      <h2 className="text-sm font-semibold text-white">GitHub repository</h2>
      <p className="mt-2 text-xs leading-5 text-slate-300">
        Link the repository you want beside your DreamMakerHub project. GitHub issues, pull requests,
        discussions and actions then open the matching repository using your own GitHub login.
        Linking does not automatically import, publish or push project files.
      </p>
      {repository && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs">
          <a href={`https://github.com/${repository}`} target="_blank" rel="noopener noreferrer"
            className="break-all font-semibold text-emerald-200 underline">{repository} ↗</a>
          <button type="button" disabled={saving} onClick={() => void unlink()}
            className="text-amber-200 underline disabled:opacity-50">Unlink</button>
        </div>
      )}
      <form onSubmit={event => void save(event)} className="mt-3 space-y-2">
        <label htmlFor="project-github-repo" className="block text-xs font-medium text-slate-200">Repository URL or owner/name</label>
        <input id="project-github-repo" value={input} onChange={event => setInput(event.target.value)}
          placeholder="owner/repository" maxLength={150} autoComplete="off"
          className="w-full rounded-lg border border-white/20 bg-[#080f1d] px-3 py-2 text-xs text-white" />
        <button type="submit" disabled={saving || !input.trim()} className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">
          {saving ? "Checking GitHub…" : repository ? "Change linked repository" : "Verify and link repository"}
        </button>
      </form>
      {message && <p role="status" className="mt-2 text-xs text-amber-200">{message}</p>}
      <p className="mt-2 text-[11px] text-slate-400">Private repositories require a GitHub-authorized session. No GitHub token is saved.</p>
    </section>
  );
}
