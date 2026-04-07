import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicAiModules } from "@core/ai/modules/registry";
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

async function fetchGroqModules(): Promise<RegistryModule[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];

  try {
    // Return static list of GROQ models
    const models: RegistryModule[] = [
      {
        id: "groq-llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant",
        description: "Fast and efficient Llama 3.1 model for general tasks",
        category: "chat",
        source: "groq",
        private: false,
      },
      {
        id: "groq-llama-3.1-70b-versatile",
        name: "Llama 3.1 70B Versatile",
        description: "High-performance Llama 3.1 model with enhanced capabilities",
        category: "chat",
        source: "groq",
        private: false,
      },
      {
        id: "groq-mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        description: "Mixture of experts model for complex reasoning",
        category: "chat",
        source: "groq",
        private: false,
      },
      {
        id: "groq-gemma-7b-it",
        name: "Gemma 7B",
        description: "Lightweight and efficient instruction-tuned model",
        category: "chat",
        source: "groq",
        private: false,
      },
    ];

    return models;
  } catch (error) {
    console.error("GROQ models fetch errored", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const paidUser = await requirePaidAIUser(req);
  if (paidUser instanceof NextResponse) return paidUser;

  const registryModules = publicAiModules;
  const googleAIModules = await fetchGoogleAIModules();
  const groqModules = await fetchGroqModules();
  const modules: RegistryModule[] = [
    ...registryModules.map((module) => ({ ...module, source: "public-registry" })),
    ...googleAIModules,
    ...groqModules,
  ];
  const sources = [];
  if (googleAIModules.length > 0) sources.push("google");
  if (groqModules.length > 0) sources.push("groq");
  sources.push("public-registry");
  const source = sources.join("+");

  return NextResponse.json({ ok: true, source, modules });
}
