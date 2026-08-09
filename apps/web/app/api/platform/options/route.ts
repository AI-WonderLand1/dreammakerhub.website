import { NextResponse } from "next/server";
import { logger } from '@/lib/logger';

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
      option("ai-builder", "Wonderbuild", "Build websites and games with AI agents. Describe it, watch three agents collaborate to generate, review, and deliver working code.", "/wonder-build/studio"),
      option("ai-modules", "AI Modules", "Browse model-backed modules and run prompt experiments.", "/ai-modules"),
      option("playground", "Playground", "Train, create, and test AI modules.", "/wonder-build", "beta"),
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
