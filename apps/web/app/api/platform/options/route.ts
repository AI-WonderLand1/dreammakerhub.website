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
      option("ai-builder", "AI Builder", "Build websites and games with AI agents. Describe it, watch three agents collaborate to generate, review, and deliver working code.", "/wonder-build/ai-builder"),
      option("ai-modules", "AI Modules", "Browse model-backed modules and run prompt experiments.", "/ai-modules"),
      option("playground", "Playground", "Run fast prompt and model tests in the tools playground.", "/playground", "beta"),
    ],
    agents: [
      option("dashboard-agents", "Dashboard Agents", "Configure and compare agent patterns for product tasks.", "/dashboard/agents"),
      option("playcanvas-bridge", "PlayCanvas Bridge", "Use Theia handoff payloads for forked PlayCanvas editor workflows.", "/dashboard/editor-playcanvas"),
    ],
    runners: [
      option("project-runner", "Project Runner API", "Execute sandboxed runtime actions through /api/playground/run.", "/dashboard/projects", "beta"),
      option("collaboration", "Collaboration Runner", "Operate shared workspace actions and comments in one place.", "/dashboard/collaboration"),
    ],
    workers: [
      option("terminal-worker", "Terminal Exec", "Run controlled terminal execution via SSH/terminal endpoints.", "/dashboard/overview", "beta"),
      option("settings-security", "Security Controls", "Manage access and security posture for automation surfaces.", "/settings/security"),
    ],
  });
}
