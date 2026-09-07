import { NextResponse } from "next/server";

type Option = {
  id: string;
  name: string;
  summary: string;
  status: "ready" | "beta";
  href: string;
};

function option(id: string, name: string, summary: string, href: string, status: "ready" | "beta" = "ready"): Option {
  return { id, name, summary, href, status };
}

export async function GET() {
  return NextResponse.json({
    ai: [
      option("wonderbuild", "WonderBuild", "Create websites and web apps with AI, templates, visual editing, code, preview, and publish.", "/wonder-build"),
      option("ai-modules", "AI Modules", "Browse model-backed modules and run prompt experiments.", "/ai-modules"),
      option("playground", "AI Playground", "Test prompts, providers, models, and agent workflows.", "https://playground.dreammakerhub.website/", "beta"),
    ],
    agents: [
      option("dashboard-agents", "Dashboard Agents", "Configure and compare agent patterns for product tasks.", "/dashboard/agents"),
      option("playcanvas-bridge", "PlayCanvas Bridge", "Use Theia handoff payloads for forked PlayCanvas editor workflows.", "/dashboard/editor-playcanvas"),
    ],
    runners: [
      option("project-runner", "Project Runner API", "Execute sandboxed runtime actions.", "/dashboard/projects", "beta"),
      option("collaboration", "Collaboration Runner", "Operate shared workspace actions and comments in one place.", "/dashboard/collaboration"),
    ],
    workers: [
      option("terminal-worker", "Terminal Exec", "Run controlled terminal execution via SSH/terminal endpoints.", "/dashboard/settings", "beta"),
      option("settings-security", "Security Controls", "Manage access and security posture for automation surfaces.", "/settings/security"),
    ],
  });
}
