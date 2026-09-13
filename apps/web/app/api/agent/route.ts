import { NextResponse } from "next/server";
import { z } from "zod";
import { runModel } from "../../../../../engine/core/ai/runModel";
import { manifestVisualBlock } from "../../../../../engine/core/ai/bridge";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AgentRequestSchema = z.object({
  agent: z.enum(["builder", "designer", "debugger"]).default("builder"),
  command: z.string().min(1).max(5000),
  projectId: z.string().uuid().optional(),
});

const dangerousGeneratedPatterns = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /require\s*\(/gi,
  /child_process/gi,
  /\bexec\s*\(/gi,
  /\bspawn\s*\(/gi,
];

function stripJsonFence(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseManifest(text: string): { code?: string; glimpse?: string; confession?: string } | null {
  const cleaned = stripJsonFence(text);
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  return null;
}

function inferCategory(agent: string, command: string) {
  const lower = command.toLowerCase();
  if (/\b(debug|fix|error|broken|bug)\b/.test(lower)) return 'debug';
  if (/\b(design|style|layout|color|ui|ux)\b/.test(lower)) return 'design';
  if (/\b(test|lint|format)\b/.test(lower)) return lower.match(/\b(test|lint|format)\b/)?.[1] || 'build';
  return agent === 'debugger' ? 'debug' : agent === 'designer' ? 'design' : 'build';
}

export async function POST(req: Request) {
  try {
    const result = AgentRequestSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json({ status: "error", error: "Invalid request", details: result.error.issues }, { status: 400 });
    }

    const { agent, command } = result.data;
    const category = inferCategory(agent, command);
    const systemPrompt = `You are the Wonderland ${agent === "designer" ? "Designer" : agent === "debugger" ? "Debugger" : "Builder"}.
Respond to the user's natural-language request directly. The user does not need to use special command words.

USER REQUEST: ${JSON.stringify(command)}
TASK CATEGORY: ${category}

Rules:
1. Build, design, explain, or debug exactly what the user asked for.
2. When code is requested, return a complete safe React component rather than placeholder snippets.
3. Never claim work is finished if you did not produce the requested result.
4. Never use eval, Function, require, child_process, process execution, filesystem access, or dynamic code execution.
5. Do not invent fake runtime results.

Return JSON only:
{
  "code": "full result or component code when code is appropriate",
  "glimpse": "clear useful explanation of what you produced",
  "confession": "real limitations or compromises, if any"
}`;

    const aiResponse = await runModel({
      model: "openrouter/meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: command }],
      system: systemPrompt,
      temperature: 0.7,
    });

    if (aiResponse.error || !aiResponse.text.trim()) {
      return NextResponse.json({ status: "error", error: aiResponse.error || "AI returned an empty response" }, { status: 502 });
    }

    const manifest = parseManifest(aiResponse.text);
    if (!manifest) {
      return NextResponse.json({
        status: "success",
        answer: aiResponse.text,
        response: aiResponse.text,
        glimpse: "AI returned a direct response.",
        confession: "The response was not structured as agent JSON, so no visual block was manifested.",
        commandCategory: category,
      });
    }

    if (manifest.code) {
      for (const pattern of dangerousGeneratedPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(manifest.code)) {
          logger.error("AI generated blocked code pattern", { pattern: pattern.toString() });
          return NextResponse.json({ status: "error", error: "Generated code contains an unsafe execution pattern" }, { status: 500 });
        }
      }
    }

    let manifestationResult: { path?: string } | null = null;
    if (manifest.code) {
      manifestationResult = manifestVisualBlock(
        `${agent}-${Date.now()}.tsx`,
        manifest.code,
        manifest.confession || "",
      );
    }

    const answer = manifest.code || manifest.glimpse || aiResponse.text;
    if (!answer?.trim()) {
      return NextResponse.json({ status: "error", error: "AI returned no usable result" }, { status: 502 });
    }

    return NextResponse.json({
      status: "success",
      success: true,
      answer,
      response: manifest.glimpse || answer,
      code: manifest.code,
      glimpse: manifest.glimpse,
      confession: manifest.confession,
      path: manifestationResult?.path,
      commandCategory: category,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Agent request failed", { error: message });
    return NextResponse.json({ status: "error", error: "AI agent request failed" }, { status: 500 });
  }
}
