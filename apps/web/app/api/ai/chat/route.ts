import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { ensureDefaultProject } from '@lib/projects/storage';
import { generateAndSaveProject } from '@core/ai/orchestrator';
import { runAIPipeline } from '@core/ai/index.ts/runtime/pipeline';
import { requirePaidAIUser } from '@/app/api/ai/auth';

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt required"),
  agentId: z.string().trim().min(1, "Agent required"),
  targetLanguage: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
});

const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'shell',
  'sql', 'html', 'css', 'json', 'yaml', 'markdown'
];

const HUMAN_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'egy', name: 'Ancient Egyptian' },
];

function detectProgrammingLanguage(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  for (const lang of PROGRAMMING_LANGUAGES) {
    if (lower.includes(lang) || lower.includes(`in ${lang}`)) return lang;
  }
  return null;
}

function detectHumanLanguage(prompt: string): string {
  if (/[\u4e00-\u9fa5]/.test(prompt)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(prompt)) return 'ja';
  if (/\b(hola|gracias|buenos)\b/i.test(prompt)) return 'es';
  return 'en';
}

const AGENTS = {
  "builder-default": { id: "gemini-1.5-flash-latest", provider: "google" },
  "openrouter-general": { id: "openrouter/auto", provider: "openrouter" },
};

const planForRequest = (req: NextRequest) => req.headers.get("x-plan") || "free";

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    const paidUser = await requirePaidAIUser(req);
    if (paidUser instanceof NextResponse) return paidUser;

    const body = await requestSchema.safeParseAsync(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_REQUEST", message: body.error.message }, traceId },
        { status: 400 }
      );
    }

    const { prompt, agentId, targetLanguage } = body.data;

    const agent = (AGENTS as any)[agentId];
    if (!agent) {
      return NextResponse.json(
        { ok: false, error: { code: "AGENT_NOT_FOUND", message: "Agent not available" }, traceId },
        { status: 403 }
      );
    }

    const plan = planForRequest(req);
    if (plan === "free" && agent.provider === "openrouter") {
      return NextResponse.json(
        { ok: false, error: { code: "PLAN_RESTRICTED", message: "Upgrade required for this agent" }, traceId },
        { status: 403 }
      );
    }

    const detectedHumanLang = targetLanguage || detectHumanLanguage(prompt);
    const detectedProgLang = detectProgrammingLanguage(prompt);

    let enhancedPrompt = prompt;

    if (detectedHumanLang !== 'en') {
      const lang = HUMAN_LANGUAGES.find(l => l.code === detectedHumanLang);
      enhancedPrompt = `IMPORTANT: Respond in ${lang?.name || 'English'}. Maintain this language.\n\n${prompt}`;
    }

    if (detectedProgLang) {
      enhancedPrompt += `\n\nProvide clean, documented ${detectedProgLang} code.`;
    }

    const project = await ensureDefaultProject(paidUser.userId, "AI Chat Project");

    const pipelineResult = await runAIPipeline({
      operationId: traceId,
      userPrompt: enhancedPrompt,
      language: detectedHumanLang,
      model: agent.id,
    });

    await generateAndSaveProject({
      projectId: project.id,
      ownerId: paidUser.userId,
      prompt,
      agentId,
    } as any);

    return NextResponse.json({
      ok: true,
      message: "generated",
      traceId,
      agentId,
      result: {
        response: pipelineResult.finalText,
        confessions: pipelineResult.confessions,
        detectedHumanLang: detectedHumanLang
      }
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: error.message || "Internal server error" }, traceId },
      { status: 500 }
    );
  }
}
