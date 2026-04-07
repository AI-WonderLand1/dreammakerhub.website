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

async function fetchGoogleAIModules(): Promise<RegistryModule[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return [];

  try {
    // Return static list of Google AI models since they don't have a models API
    const models: RegistryModule[] = [
      {
        id: "google-gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "Fast and efficient Gemini model for general tasks",
        category: "chat",
        source: "google",
        private: false,
      },
      {
        id: "google-gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Advanced Gemini model with enhanced capabilities",
        category: "chat",
        source: "google",
        private: false,
      },
      {
        id: "google-gemini-1.5-pro-vision",
        name: "Gemini 1.5 Pro Vision",
        description: "Gemini model with vision capabilities",
        category: "vision",
        source: "google",
        private: false,
      },
    ];

    return models;
      }

      return {
        id,
        name,
        description,
        category,
        source: "openrouter",
      } satisfies RegistryModule;
    });
  } catch (error) {
    console.error("OpenRouter models fetch errored", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const paidUser = await requirePaidAIUser(req);
  if (paidUser instanceof NextResponse) return paidUser;

  const registryModules = publicAiModules;
  const googleAIModules = await fetchGoogleAIModules();
  const modules: RegistryModule[] = [
    ...registryModules.map((module) => ({ ...module, source: "public-registry" })),
    ...googleAIModules,
  ];
  const source = googleAIModules.length > 0 ? "public-registry+google" : "public-registry";

  return NextResponse.json({ ok: true, source, modules });
}
