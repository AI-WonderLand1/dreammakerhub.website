import { NextResponse } from "next/server";

type Option = {
  id: string;
  name: string;
  summary: string;
  status: "ready";
  href: string;
};

function option(id: string, name: string, summary: string, href: string): Option {
  return { id, name, summary, href, status: "ready" };
}

export async function GET() {
  return NextResponse.json({
    ai: [
      option("wonderbuild", "WonderBuild", "Create websites and web apps with AI, templates, visual editing, code, preview, and publish.", "/wonder-build"),
      option("ai-modules", "AI Modules", "Browse model-backed modules and run prompt experiments.", "/ai-modules"),
      option("playground", "AI Playground", "Use the live DreamMakerHub AI Playground.", "https://playground.dreammakerhub.website/"),
    ],
    agents: [
      option("playcanvas-bridge", "PlayCanvas Bridge", "Open the working PlayCanvas integration and project artifact tools.", "/dashboard/editor-playcanvas"),
      option("collaboration", "Collaboration", "View active project collaboration sessions.", "/dashboard/collaboration"),
    ],
    runners: [],
    workers: [
      option("security", "Security Controls", "Review live DreamMakerHub security checks and findings.", "/dashboard/aetherguard"),
    ],
  }, { headers: { "Cache-Control": "private, no-store" } });
}
