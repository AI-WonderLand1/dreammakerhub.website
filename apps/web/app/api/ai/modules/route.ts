import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicAiModules } from "@/core/ai/modules/registry";
import { requirePaidAIUser } from "@/app/api/ai/auth";

export const runtime = "nodejs";

type RegistryModule = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  html_url?: string;
  topics?: string[];
  private?: boolean;
  source?: string;
};

async function fetchGithubModules(): Promise<RegistryModule[]> {
  const apiKey = process.env.GITHUB_MODELS_API_KEY;
  if (!apiKey) return [];

  try {
    // Return static list of GitHub Models
    const models: RegistryModule[] = [
      {
        id: "github-gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and efficient GPT-4o model for general tasks",
        category: "chat",
        source: "github",
        private: false,
      },
      {
        id: "github-gpt-4o",
        name: "GPT-4o",
        description: "High-performance GPT-4o model with enhanced capabilities",
        category: "chat",
        source: "github",
        private: false,
      },
      {
        id: "github-gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Advanced GPT-4 model for complex reasoning",
        category: "chat",
        source: "github",
        private: false,
      },
      {
        id: "github-gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Lightweight and efficient GPT-3.5 model",
        category: "chat",
        source: "github",
        private: false,
      },
    ];

    return models;
  } catch (error) {
    console.error("GitHub Models fetch errored", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const paidUser = await requirePaidAIUser(req);
  if (paidUser instanceof NextResponse) return paidUser;

  const registryModules = publicAiModules;
  const googleAIModules = await fetchGoogleAIModules();
  const githubModules = await fetchGithubModules();
  const modules: RegistryModule[] = [
    ...registryModules.map((module) => ({ ...module, source: "public-registry" })),
    ...googleAIModules,
    ...githubModules,
  ];
  const sources = [];
  if (googleAIModules.length > 0) sources.push("google");
  if (githubModules.length > 0) sources.push("github");
  sources.push("public-registry");
  const source = sources.join("+");

  return NextResponse.json({ ok: true, source, modules });
}
