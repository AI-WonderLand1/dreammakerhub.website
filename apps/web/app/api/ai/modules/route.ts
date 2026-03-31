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

async function fetchOpenRouterModules(): Promise<RegistryModule[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("OpenRouter models fetch failed", await res.text());
      return [];
    }

    const data = await res.json();
    const models = Array.isArray(data?.data) ? data.data : [];

    return models.map((model: any) => {
      const modality = (model?.architecture?.modality || "").toString().toLowerCase();
      const id = `openrouter-${model?.id || crypto.randomUUID()}`;
      const name = model?.name || model?.id || "OpenRouter model";
      const description =
        model?.description || model?.meta?.description || `Model ${name} available via OpenRouter`;

      let category: string = "chat";
      if (modality.includes("vision") || /vision|image/.test(String(model?.id ?? ""))) {
        category = "vision";
      } else if (/code/.test(String(model?.id ?? ""))) {
        category = "code";
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
  const openRouterModules = await fetchOpenRouterModules();
  const modules: RegistryModule[] = [
    ...registryModules.map((module) => ({ ...module, source: "public-registry" })),
    ...openRouterModules,
  ];
  const source = openRouterModules.length > 0 ? "public-registry+openrouter" : "public-registry";

  return NextResponse.json({ ok: true, source, modules });
}
