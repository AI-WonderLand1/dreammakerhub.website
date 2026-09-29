"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, Bot, BookOpen, CircleDot, Code2, GitPullRequest,
  MessageSquare, PanelsTopLeft, PlayCircle, Settings, ShieldCheck,
} from "lucide-react";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import { githubRepositoryLink, parseGithubRepository, type GithubSection } from "@/lib/wonderspace/github-repository";

type Item = {
  label: string;
  icon: typeof Code2;
  href: string | null;
  external?: boolean;
  description?: string;
};

export default function WonderSpaceProjectNavigation({
  projectId,
  active,
}: {
  projectId?: string | null;
  active?: "code" | "projects";
}) {
  const [repo, setRepo] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"none" | "loading" | "ready" | "unavailable">("none");
  const [refreshKey, setRefreshKey] = useState(0);
  const id = projectId ? encodeURIComponent(projectId) : null;
  const query = id ? `?projectId=${id}` : "";

  useEffect(() => {
    const refresh = () => setRefreshKey(key => key + 1);
    window.addEventListener("wonderspace:github-link-updated", refresh);
    return () => window.removeEventListener("wonderspace:github-link-updated", refresh);
  }, []);

  useEffect(() => {
    let live = true;
    setRepo(null);
    if (!projectId) {
      setConnectionStatus("none");
      return;
    }
    setConnectionStatus("loading");
    fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}/github-connection`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Repository connection unavailable");
        return response.json();
      })
      .then((data) => {
        if (!live) return;
        setRepo(parseGithubRepository(data?.repository?.fullName));
        setConnectionStatus("ready");
      })
      .catch(() => { if (live) setConnectionStatus("unavailable"); });
    return () => { live = false; };
  }, [projectId, refreshKey]);

  const github = (section: GithubSection) => repo ? githubRepositoryLink(repo, section) : null;
  const items: Item[] = [
    { label: "Code", icon: Code2, href: id ? `/dashboard/projects/${id}/files` : "/wonderspace/browser" },
    { label: "Issues", icon: CircleDot, href: github("issues"), external: true },
    { label: "Pull requests", icon: GitPullRequest, href: github("pulls"), external: true },
    { label: "Agents", icon: Bot, href: `/dashboard/agents${query}` },
    { label: "Discussions", icon: MessageSquare, href: github("discussions"), external: true },
    { label: "Actions", icon: PlayCircle, href: github("actions"), external: true },
    { label: "Projects", icon: PanelsTopLeft, href: "/dashboard#projects" },
    { label: "Wiki", icon: BookOpen, href: github("wiki"), external: true },
    { label: "Security & quality", icon: ShieldCheck, href: `/dashboard/aetherguard${query}` },
    { label: "Usage & insights", icon: Activity, href: `/dashboard/usage${query}` },
    { label: "Settings", icon: Settings, href: `/dashboard/settings${query}` },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b111e]">
      <nav aria-label="WonderSpace project tools" className="flex items-center gap-0.5 overflow-x-auto px-2 text-sm">
        {items.map(({ label, icon: Icon, href, external }) => {
          const selected = active === "code" ? label === "Code" : active === "projects" && label === "Projects";
          const cls = `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${selected ? "border-cyan-400 font-semibold text-white" : "border-transparent text-slate-300 hover:border-white/25 hover:bg-white/5 hover:text-white"}`;
          if (!href) return (
            <span key={label} aria-disabled="true"
              title={id ? "Link a readable GitHub repository from this project's code editor." : "Select a project and link its GitHub repository."}
              className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm text-white/30">
              <Icon size={16} aria-hidden="true" /> {label}
            </span>
          );
          return external ? (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} on GitHub (new tab)`} className={cls}>
              <Icon size={16} aria-hidden="true" />{label}<span className="text-[9px] text-slate-500">↗</span>
            </a>
          ) : (
            <Link key={label} href={href} aria-current={selected ? "page" : undefined} className={cls}>
              <Icon size={16} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.07] px-3 py-2 text-[11px] text-slate-400">
        <span>
          {connectionStatus === "loading" ? "Checking project repository…" :
            repo ? `GitHub: ${repo} · external repository tools` :
              connectionStatus === "unavailable" ? "Repository status unavailable; your DreamMakerHub files remain accessible." :
                "DreamMakerHub files are saved here. GitHub tabs need a linked repository."}
        </span>
        {id && !repo && (
          <Link href={`/dashboard/projects/${id}/files#github-repository-connection`} className="font-semibold text-cyan-300 hover:underline">
            Link GitHub repository
          </Link>
        )}
        {repo && <span className="text-slate-500">Navigation link only · no automatic push or pull</span>}
      </div>
    </div>
  );
}
