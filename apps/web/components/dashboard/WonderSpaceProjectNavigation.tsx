"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Bot, BookOpen, CircleDot, Code2, GitCommitHorizontal, MessageSquare, PanelsTopLeft, Settings, ShieldCheck,
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
  advancedOnly = false,
}: {
  projectId?: string | null;
  active?: "code" | "projects" | "issues" | "discussions" | "wiki";
  advancedOnly?: boolean;
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
    { label: "Files & Code", icon: Code2, href: projectPath ? `${projectPath}/files` : "/dashboard#projects", selected: currentTab === "code" },
    { label: "Issues", icon: CircleDot, href: projectPath ? `${projectPath}/issues` : null, selected: currentTab === "issues", description: "Select a DreamMakerHub project to manage its issues." },
    { label: "Agents", icon: Bot, href: `/dashboard/agents${query}` },
    { label: "Discussions", icon: MessageSquare, href: projectPath ? `${projectPath}/discussions` : null, selected: currentTab === "discussions", description: "Select a DreamMakerHub project to open its discussions." },
    { label: "Projects", icon: PanelsTopLeft, href: id ? `/dashboard?projectId=${id}#projects` : "/dashboard#projects", selected: currentTab === "projects" },
    { label: "History", icon: GitCommitHorizontal, href: projectPath ? `${projectPath}/files#version-history` : null, description: "Select a project to save, compare or download source versions." },
    { label: "Wiki", icon: BookOpen, href: projectPath ? `${projectPath}/wiki` : null, selected: currentTab === "wiki", description: "Select a DreamMakerHub project to edit its wiki." },
    { label: "Security", icon: ShieldCheck, href: `/dashboard/aetherguard${query}` },
    { label: "Insights", icon: Activity, href: `/dashboard/usage${query}` },
    { label: "Settings", icon: Settings, href: `/dashboard/settings${query}` },
  ];

  return (
    <div className="border-b border-white/10 bg-[#070d17]">
      <nav
        aria-label="Project navigation"
        className="flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap px-1 text-sm"
      >
        {items.map(({ label, icon: Icon, href, selected }) => {
          if (!href) return null;
          const cls = `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${selected ? "border-cyan-400 font-semibold text-white" : "border-transparent text-slate-300 hover:border-white/25 hover:text-white"}`;
          return (
            <Link key={label} href={href} aria-current={selected ? "page" : undefined} className={cls}>
              <Icon size={16} aria-hidden="true" /> {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
