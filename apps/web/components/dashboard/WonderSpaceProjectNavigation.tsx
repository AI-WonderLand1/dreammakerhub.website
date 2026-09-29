"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Bot, BookOpen, CircleDot, Code2, GitPullRequest,
  MessageSquare, PanelsTopLeft, PlayCircle, Settings, ShieldCheck,
} from "lucide-react";

type Item = {
  label: string;
  icon: typeof Code2;
  href: string | null;
  description?: string;
  selected?: boolean;
};

export default function WonderSpaceProjectNavigation({
  projectId,
  active,
}: {
  projectId?: string | null;
  active?: "code" | "projects" | "issues" | "discussions" | "wiki";
}) {
  const pathname = usePathname();
  const id = projectId ? encodeURIComponent(projectId) : null;
  const projectPath = id ? `/dashboard/projects/${id}` : null;
  const query = id ? `?projectId=${id}` : "";
  const currentTab = active ?? (
    pathname.endsWith("/files") ? "code" :
    pathname.endsWith("/issues") ? "issues" :
    pathname.endsWith("/discussions") ? "discussions" :
    pathname.endsWith("/wiki") ? "wiki" : undefined
  );

  // A WonderSpace project is first-party: all working tabs use its own
  // authenticated project storage. No tab navigates to an external code host.
  const items: Item[] = [
    { label: "Code", icon: Code2, href: projectPath ? `${projectPath}/files` : "/wonderspace/browser", selected: currentTab === "code" },
    { label: "Issues", icon: CircleDot, href: projectPath ? `${projectPath}/issues` : null, selected: currentTab === "issues", description: "Select a DreamMakerHub project to manage its issues." },
    { label: "Pull requests", icon: GitPullRequest, href: null, description: "Native branch reviews will be available after the WonderSpace version-control backend is verified." },
    { label: "Agents", icon: Bot, href: `/dashboard/agents${query}` },
    { label: "Discussions", icon: MessageSquare, href: projectPath ? `${projectPath}/discussions` : null, selected: currentTab === "discussions", description: "Select a DreamMakerHub project to open its discussions." },
    { label: "Actions", icon: PlayCircle, href: null, description: "Native CI runs are not connected yet. Existing customers' projects are not automatically executed." },
    { label: "Projects", icon: PanelsTopLeft, href: id ? `/dashboard?projectId=${id}#projects` : "/dashboard#projects", selected: currentTab === "projects" },
    { label: "Wiki", icon: BookOpen, href: projectPath ? `${projectPath}/wiki` : null, selected: currentTab === "wiki", description: "Select a DreamMakerHub project to edit its wiki." },
    { label: "Security & quality", icon: ShieldCheck, href: `/dashboard/aetherguard${query}` },
    { label: "Usage & insights", icon: Activity, href: `/dashboard/usage${query}` },
    { label: "Settings", icon: Settings, href: `/dashboard/settings${query}` },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b111e]">
      <nav aria-label="WonderSpace project tools" className="flex items-center gap-0.5 overflow-x-auto px-2 text-sm">
        {items.map(({ label, icon: Icon, href, description, selected }) => {
          const cls = `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${selected ? "border-cyan-400 font-semibold text-white" : "border-transparent text-slate-300 hover:border-white/25 hover:bg-white/5 hover:text-white"}`;
          if (!href) return (
            <span
              key={label}
              aria-disabled="true"
              title={description || "WonderSpace native support is being developed."}
              className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm text-white/35"
            >
              <Icon size={16} aria-hidden="true" /> {label}
              {label === "Pull requests" || label === "Actions" ? <span className="text-[9px] text-amber-300/70">Planned</span> : null}
            </span>
          );
          return (
            <Link key={label} href={href} aria-current={selected ? "page" : undefined} className={cls}>
              <Icon size={16} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.07] px-3 py-2 text-[11px] text-slate-400">
        <span>
          {projectPath
            ? "WonderSpace-native project · Code, Issues, Discussions and Wiki share your DreamMakerHub project."
            : "Create or select a DreamMakerHub project to open its native repository tools."}
        </span>
        {projectPath && (
          <Link href={`${projectPath}/files`} className="font-semibold text-cyan-300 hover:underline">
            Open project files →
          </Link>
        )}
      </div>
    </div>
  );
}
