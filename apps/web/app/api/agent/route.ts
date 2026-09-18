import { NextResponse } from "next/server";
import { z } from "zod";
import { runModel } from "../../../../../engine/core/ai/runModel";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/app/utils/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AgentRequestSchema = z.object({
  agent: z.enum(["builder", "designer", "debugger"]).default("builder"),
  command: z.string().min(1).max(5000),
  projectId: z.string().uuid().optional(),
});

const dangerousGeneratedPatterns = [
  /eval\s*\(/gi, /Function\s*\(/gi, /require\s*\(/gi,
  /child_process/gi, /\bexec\s*\(/gi, /\bspawn\s*\(/gi,
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
  // This route is directly callable, so the UI's subscription gate is not sufficient.
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ status: 'error', error: 'Sign in to use agents.' }, { status: 401 });
  }
  try {
    const supabase = await createClient();
    const { data: profile, error: planError } = await supabase
      .from('profiles').select('subscription_tier').eq('id', userId).maybeSingle();
    if (planError) {
      logger.error('Agent plan lookup failed', { error: planError.message });
      return NextResponse.json({ status: 'error', error: 'Unable to verify subscription.' }, { status: 503 });
    }
    if (!['pro', 'team', 'enterprise'].includes(profile?.subscription_tier || 'free')) {
      return NextResponse.json({ status: 'error', error: 'Agents require a paid plan.', upgrade: true }, { status: 402 });
    }

    const result = AgentRequestSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json({ status: 'error', error: 'Invalid request', details: result.error.issues }, { status: 400 });
    }

    const { agent, command } = result.data;
    const category = inferCategory(agent, command);
    const systemPrompt = `You are the Wonderland ${agent === 'designer' ? 'Designer' : agent === 'debugger' ? 'Debugger' : 'Builder'}.
Respond to the user's natural-language request directly. Do not pretend to have edited project files.
USER REQUEST: ${JSON.stringify(command)}
TASK CATEGORY: ${category}
Rules: Give a safe, useful response. Never use eval, Function, require, child_process, process execution or filesystem access. Never invent runtime results.
Return JSON only: {"code":"complete result or component code when appropriate","glimpse":"brief explanation","confession":"real limitations or compromises, if any"}`;
    const aiResponse = await runModel({
      model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: command }],
      system: systemPrompt,
      temperature: 0.7,
    });
    if (aiResponse.error || !aiResponse.text?.trim()) {
      return NextResponse.json({ status: 'error', error: 'AI agent could not produce a response.' }, { status: 502 });
    }
    const manifest = parseManifest(aiResponse.text);
    if (!manifest) {
      return NextResponse.json({ status: 'success', answer: aiResponse.text, response: aiResponse.text,
        glimpse: 'AI returned a direct response.', confession: 'No project files were saved.', commandCategory: category });
    }
    if (manifest.code) {
      for (const pattern of dangerousGeneratedPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(manifest.code)) {
          logger.error('AI generated blocked code pattern', { pattern: pattern.toString() });
          return NextResponse.json({ status: 'error', error: 'Generated code contains an unsafe execution pattern' }, { status: 500 });
        }
      }
    }
    const answer = manifest.code || manifest.glimpse || aiResponse.text;
    if (!answer?.trim()) return NextResponse.json({ status: 'error', error: 'AI returned no usable result' }, { status: 502 });
    // An authenticated user is not automatically authorized to write shared server files.
    // Return proposed code only; the project editor must use its ownership-checked save API.
    return NextResponse.json({ status: 'success', success: true, answer,
      response: manifest.glimpse || answer, code: manifest.code, glimpse: manifest.glimpse,
      confession: [manifest.confession, 'No project files were saved by this agent endpoint.'].filter(Boolean).join(' '),
      commandCategory: category });
  } catch (err: unknown) {
    logger.error('Agent request failed', { error: err instanceof Error ? err.message : 'Unknown error' });
    return NextResponse.json({ status: 'error', error: 'AI agent request failed' }, { status: 500 });
  }
}
