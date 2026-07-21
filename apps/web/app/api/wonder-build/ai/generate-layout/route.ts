import { NextRequest, NextResponse } from "next/server";
import { WonderBuildEngine } from "@/lib/3dWonderBuildEngine";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const wonderEngine = new WonderBuildEngine();

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    const localResult = await wonderEngine.generateLayout(prompt);

    return NextResponse.json(
      {
        id: "wonder-build-local",
        name: "Local Build",
        description: "Generated locally without external AI",
        pageTypeDetected: "landing-page",
        promptAnalysis: `Analyzed prompt: "${prompt}"`,
        overallStrategy: "Local Wonder-Build generation",
        blocks: [
          {
            blockId: "hero",
            label: "Generated Section",
            props: { html: localResult.html },
            css: localResult.css,
            reasoning: "Local deterministic output",
            confidence: 0.95,
            alternativesConsidered: [],
          },
        ],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logger.error("Layout generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}