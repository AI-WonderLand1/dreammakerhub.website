import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { ensureDefaultProject } from '@/lib/projects/storage';
import { runAIPipeline } from '@/core/ai/pipeline-v1/runtime/pipeline';
import { AI_LAWS, buildLawPrompt, getPersonaPrompt } from '@/core/ai/personas';
import { writeAiMemoryEntry } from '@/lib/ai/memoryStore';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { storeConfessionToMem0, isMem0Enabled } from '@/lib/ai/mem0Client';
import { getConfessionConfig } from '@/lib/ai/confessionConfig';
import { searchMemories, storeMemory } from '@/lib/ai/mem0Service';

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt required"),
  agentId: z.string().trim().min(1, "Agent required"),
  targetLanguage: z.string().optional(),
  personaId: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
  outputFormat: z.enum(["text", "puck"]).optional().default("text"),
  existingComponents: z.array(z.object({
    type: z.string(),
    props: z.record(z.unknown()),
  })).optional(),
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
  "builder-default": { id: "openrouter/meta-llama/llama-3.3-70b-instruct", provider: "openrouter" },
  "github-fast": { id: "openrouter/google/gemini-flash-1.5", provider: "openrouter" },
  "github-powerful": { id: "openrouter/meta-llama/llama-3.3-70b-instruct", provider: "openrouter" },
  "google-vision": { id: "google/gemini-2.5-flash", provider: "google" },
  "openrouter-general": { id: "google/gemini-flash-1.5", provider: "openrouter" },
};

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

    const { prompt, agentId, targetLanguage, personaId, outputFormat, existingComponents } = body.data;

    const agent = (AGENTS as any)[agentId];
    if (!agent) {
      return NextResponse.json(
        { ok: false, error: { code: "AGENT_NOT_FOUND", message: "Agent not available" }, traceId },
        { status: 403 }
      );
    }

    const detectedHumanLang = targetLanguage || detectHumanLanguage(prompt);
    const detectedProgLang = detectProgrammingLanguage(prompt);

    const persona = getPersonaPrompt(personaId);
    const lawPrompt = buildLawPrompt();

    const systemInstructions: string[] = [
      "AI LAWS (HIGHEST PRIORITY - ALWAYS FOLLOW):",
      lawPrompt,
    ];
    systemInstructions.push(`PERSONA:\n${persona.prompt}`);

    if (detectedHumanLang !== 'en') {
      const lang = HUMAN_LANGUAGES.find(l => l.code === detectedHumanLang);
      systemInstructions.push(`LANGUAGE REQUIREMENT: Respond in ${lang?.name || 'English'} and maintain that language.`);
    }

    if (outputFormat === "puck") {
      const componentsList = existingComponents?.map(c => c.type).join(", ") || "none";
      systemInstructions.push(
        `OUTPUT FORMAT: Generate a website layout using these Puck components: button, input, heading, typography, cardHover, splitHero, centerHero, pricingTable, featureGrid, logoCloud, testimonialCard, stepProcess, glassAccordion, tabsSystem, ctaBox, accordionFAQ, blogPreviewGrid, teamGrid, statsSection, stickyHeader, multiColumnFooter, newsletterStrip, contactSplit.`,
        `Current page has: ${componentsList}`,
        `Respond with the component names you would use and describe their properties.`
      );
    }

    // ── Retrieve relevant past memories ──
    let memoryContext = "";
    try {
      const pastMemories = await searchMemories(prompt, paidUser.userId, 5);
      if (pastMemories.length > 0) {
        memoryContext = "\n\nRELEVANT PAST MEMORIES:\n" +
          pastMemories.map((m, i) => `${i + 1}. ${m.text}`).join("\n");
      }
    } catch {
      // mem0 not configured – skip
    }

    let enhancedPrompt = `${persona.prompt}\n\nAI LAWS:\n${lawPrompt}\n\n${prompt}${memoryContext}`;

    if (detectedProgLang) {
      enhancedPrompt += `\n\nProvide clean, documented ${detectedProgLang} code.`;
    }

    const plan = req.headers.get("x-plan") || "free";
    const config = getConfessionConfig(plan, isMem0Enabled());
    const useLLMExtraction = config.mode === "paid" && config.enableMem0;

    const project = await ensureDefaultProject(paidUser.userId, "AI Chat Project");

    const pipelineResult = await runAIPipeline({
      operationId: traceId,
      userPrompt: enhancedPrompt,
      systemPrompt: systemInstructions.join('\n\n'),
      language: detectedHumanLang,
      model: agent.id,
      useLLMExtraction,
    });

    let memoryStore: { ok: boolean; bucket?: string; path?: string; error?: string } = { ok: true };
    try {
      const memoryRef = await writeAiMemoryEntry({
        userId: paidUser.userId,
        projectId: project.id,
        traceId,
        prompt,
        response: pipelineResult.finalText,
        confessions: pipelineResult.confessions,
        persona: persona.id,
        aiLaws: AI_LAWS,
        language: detectedHumanLang,
      });
      memoryStore = { ok: true, ...memoryRef };
    } catch (memoryError: any) {
      memoryStore = { ok: false, error: memoryError?.message || 'Failed to write memory' };
    }

    let mem0Store: { ok: boolean; stored?: number; error?: string } = { ok: false };
    if (config.enableMem0) {
      try {
        // Store conversation as memory via mem0ai SDK
        await storeMemory(
          [
            { role: "user", content: prompt },
            { role: "assistant", content: pipelineResult.finalText },
          ],
          paidUser.userId,
          { traceId, projectId: project.id, persona: persona.id }
        );

        // Also store confessions if any
        let stored = 0;
        for (const confession of pipelineResult.confessions) {
          const storedConfession = {
            userId: paidUser.userId,
            projectId: project.id,
            traceId,
            type: confession.type,
            title: confession.title,
            detail: confession.detail,
            truth: confession.truth,
            what: confession.what,
            why: confession.why,
            how: confession.how,
            impactLevel: confession.impactLevel,
            machineTags: confession.machineTags,
            createdAt: new Date().toISOString(),
          };
          const result = await storeConfessionToMem0(storedConfession);
          if (result) stored++;
        }
        mem0Store = { ok: true, stored };
      } catch (mem0Error: any) {
        mem0Store = { ok: false, error: mem0Error?.message || 'Failed to store to Mem0' };
      }
    }

    return NextResponse.json({
      ok: true,
      message: "generated",
      traceId,
      agentId,
      result: {
        response: pipelineResult.finalText,
        confessions: pipelineResult.confessions,
        detectedHumanLang: detectedHumanLang,
        persona: persona.id,
        aiLaws: AI_LAWS,
        memoryStore,
        mem0Store,
        confessionMode: config.mode,
        outputFormat,
        puckData: outputFormat === "puck" ? {
          content: existingComponents || [],
          root: { type: "Fragment", props: {} },
        } : null,
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
