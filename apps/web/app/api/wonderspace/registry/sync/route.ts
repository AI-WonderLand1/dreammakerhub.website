import { NextRequest, NextResponse } from "next/server";
import { logger } from "@lib/logger";
import {
  buildRegistryAIPlan,
  evaluateAssetPresence,
  loadRegistry,
  writeRegistryLock,
} from "@lib/wonderspace/registry";

export const runtime = "nodejs";

function aiChecklistFallback(prompt: string): string[] {
  return prompt
    .split("\n")
    .filter((line) => /^\d+\./.test(line.trim()))
    .map((line) => `Validate: ${line.replace(/^\d+\.\s*/, "")}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;

    const registry = await loadRegistry();
    if (!registry.assets.length) {
      return NextResponse.json(
        {
          ok: true,
          state: "empty",
          message: "No assets configured in registry.json",
          assets: [],
        },
        { status: 200 },
      );
    }

    const results = await evaluateAssetPresence(registry);
    if (!dryRun) {
      await writeRegistryLock(results);
    }

    const aiPrompt = buildRegistryAIPlan(results);
    const aiChecklist = aiChecklistFallback(aiPrompt);

    const hasMissing = results.some((asset) => asset.status === "missing");

    return NextResponse.json({
      ok: true,
      state: hasMissing ? "warning" : "ready",
      dryRun,
      aiChecklist,
      assets: results,
    });
  } catch (error: any) {
    logger.error("Registry sync failed", { error });
    return NextResponse.json(
      {
        ok: false,
        state: "error",
        error: error?.message || "Registry sync failed",
      },
      { status: 500 },
    );
  }
}
