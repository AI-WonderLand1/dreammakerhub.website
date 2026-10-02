import { runModel } from "@core/ai/runModel";
import {
  emitProcessStep,
  emitConfession,
  emitSummary,
  emitEnd,
} from "./statusStream";
import { evaluateAgainstConstitution } from "../constitutional/evaluator";
import {
  createRiskFlagConfession,
  createUncertaintyConfession,
} from "../confessions/engine";
import type { LocalizedConfession, ConfessionType } from "../confessions/types";

interface PipelineOptions {
  operationId: string;
  userPrompt: string;
  systemPrompt?: string;
  language: string;
  model: string;
  useLLMExtraction?: boolean;
  userApiKey?: string;
  baseUrl?: string;
  beforeConfessionModelCall?: (inputCharacters: number, outputTokens: number) => Promise<void>;
}

export interface PipelineResult {
  finalText: string;
  confessions: LocalizedConfession[];
}

function parseConfessionsFromText(
  text: string,
  language: string,
  relatedStepCode?: string
): LocalizedConfession[] {
  const confessions: LocalizedConfession[] = [];
  
  const confessionRegex = /(?:TRUTH|WHAT|WHY|HOW|CONFESSION)[:-]\s*([^\n]+)/gi;
  let match;
  const foundFields: Record<string, string> = {};

  while ((match = confessionRegex.exec(text)) !== null) {
    const key = match[1].split(":")[0].trim().toUpperCase();
    const value = match[1].split(":").slice(1).join(":").trim();
    if (["TRUTH", "WHAT", "WHY", "HOW"].includes(key)) {
      foundFields[key] = value;
    }
  }

  if (Object.keys(foundFields).length > 0) {
    confessions.push({
      type: "LIMITATION",
      title: "Transparency Confession",
      detail: "Agent provided structured transparency breakdown",
      truth: foundFields["TRUTH"] || "",
      what: foundFields["WHAT"] || "",
      why: foundFields["WHY"] || "",
      how: foundFields["HOW"] || "",
      impactLevel: "LOW",
      relatedStepCode: relatedStepCode || "CONFESSION_PARSING",
      machineTags: ["transparency", "structured"],
      language,
    });
  }

  return confessions;
}

async function extractConfessionsWithLLM(
  text: string,
  language: string,
  model: string,
  userApiKey?: string,
  baseUrl?: string,
  beforeModelCall?: (inputCharacters: number, outputTokens: number) => Promise<void>,
): Promise<LocalizedConfession[]> {
  const extractionPrompt = `You are the AI Confessions transparency analyzer. Analyze the AI response and extract a user-facing record of what happened.

For each confession, provide:
- TRUTH: What actually happened or was determined
- WHAT: What action the AI took
- WHY: Why it took that action
- HOW: How it produced the result

Do not invent hidden chain-of-thought. Describe observable actions, inputs, tools, provider/model behavior, limitations, uncertainty, and decisions at a useful summary level.

If there is nothing meaningful to disclose, return an empty JSON array.

AI Response to analyze:
${text.slice(0, 4000)}

Respond as JSON only:
[{"type":"UNCERTAINTY"|"LIMITATION"|"RISK_FLAG"|"TRUTH_VERIFIED","title":"...","detail":"...","truth":"...","what":"...","why":"...","how":"..."}]`;

  try {
    const outputTokens = 2048;
    if (beforeModelCall) {
      await beforeModelCall(extractionPrompt.length, outputTokens);
    }

    const result = await runModel({
      model,
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0.3,
      maxTokens: outputTokens,
      userApiKey,
      baseUrl,
    });

    const responseText = ((result as Record<string, string>)?.text) ?? "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((p: Record<string, string>) => ({
      type: p.type as ConfessionType,
      title: p.title || "AI Confession",
      detail: p.detail || "",
      truth: p.truth || "",
      what: p.what || "",
      why: p.why || "",
      how: p.how || "",
      impactLevel: p.impactLevel || "LOW",
      relatedStepCode: "LLM_EXTRACTION",
      machineTags: ["ai-confessions", "llm-extracted"],
      language,
    }));
  } catch {
    return [];
  }
}

export async function runAIPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const {
    operationId,
    userPrompt,
    systemPrompt,
    language,
    model,
    useLLMExtraction = false,
    userApiKey,
    baseUrl,
    beforeConfessionModelCall,
  } = options;
  const confessions: LocalizedConfession[] = [];

  try {
    emitProcessStep({
      operationId,
      stepCode: "CALL_MODEL",
      stepLabel: "Calling AI model",
      stepDetail: `Using model: ${model}`,
      status: "RUNNING",
      severity: "INFO",
      language,
    });

    const modelResponse = await runModel({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      userApiKey,
      baseUrl,
    });

    const text =
      ((modelResponse as Record<string, string>)?.text) ??
      ((modelResponse as Record<string, string>)?.output) ??
      (typeof modelResponse === "string" ? modelResponse : "");

    emitProcessStep({
      operationId,
      stepCode: "CALL_MODEL",
      stepLabel: "Calling AI model",
      stepDetail: "Model returned a response.",
      status: "DONE",
      severity: "INFO",
      language,
    });

    if (!text || text.trim().length < 5) {
      const confession = createUncertaintyConfession({
        title: "I am not confident in this answer",
        detail: "The model returned a very short or empty response.",
        truth: "Model returned empty or very short response",
        what: "Returned minimal/no content",
        why: "Could not generate meaningful response",
        how: "Direct model output",
        relatedStepCode: "CALL_MODEL",
        language,
        machineTags: ["uncertainty", "low-confidence"],
      });

      confessions.push(confession);
      emitConfession({ operationId, confession });
    }

    emitProcessStep({
      operationId,
      stepCode: "CONSTITUTIONAL_CHECK",
      stepLabel: "Checking response against rules",
      stepDetail: "Evaluating AI output for rule violations.",
      status: "RUNNING",
      severity: "INFO",
      language,
    });

    const violations = evaluateAgainstConstitution(text);

    if (violations.length > 0) {
      for (const violation of violations) {
        const confession = createRiskFlagConfession({
          title: `I may have violated a rule: ${violation.ruleId}`,
          detail: violation.description,
          truth: `Detected potential violation of ${violation.ruleId}`,
          what: "Generated response that may contain sensitive data",
          why: "Response pattern matched constitutional rule",
          how: "Pattern matching evaluation",
          relatedStepCode: "CONSTITUTIONAL_CHECK",
          language,
          machineTags: ["constitutional", "risk", violation.ruleId],
        });

        confessions.push(confession);
        emitConfession({ operationId, confession });
      }
    }

    emitProcessStep({
      operationId,
      stepCode: "CONSTITUTIONAL_CHECK",
      stepLabel: "Checking response against rules",
      stepDetail:
        violations.length === 0
          ? "No rule violations detected."
          : `${violations.length} potential violations detected and confessed.`,
      status: "DONE",
      severity: violations.length === 0 ? "INFO" : "WARNING",
      language,
    });

    emitProcessStep({
      operationId,
      stepCode: "EXTRACT_CONFESSIONS",
      stepLabel: "Extracting transparency confessions",
      stepDetail: useLLMExtraction
        ? "Using the AI Confessions analyzer with the same provider credentials as the main request"
        : "Parsing structured confessions locally",
      status: "RUNNING",
      severity: "INFO",
      language,
    });

    const extractedConfessions = useLLMExtraction
      ? await extractConfessionsWithLLM(
          text,
          language,
          model,
          userApiKey,
          baseUrl,
          beforeConfessionModelCall,
        )
      : parseConfessionsFromText(text, language);

    confessions.push(...extractedConfessions);

    for (const confession of extractedConfessions) {
      emitConfession({ operationId, confession });
    }

    emitProcessStep({
      operationId,
      stepCode: "EXTRACT_CONFESSIONS",
      stepLabel: "Extracting transparency confessions",
      stepDetail: `Extracted ${extractedConfessions.length} confessions`,
      status: "DONE",
      severity: "INFO",
      language,
    });

    emitSummary({
      operationId,
      shortSummary: "AI response generated and checked.",
      longSummary:
        violations.length === 0
          ? `The AI produced a response and ${extractedConfessions.length} confessions extracted.`
          : `The AI produced a response. ${violations.length} rule violations and ${extractedConfessions.length} confessions.`,
      language,
    });

    emitEnd({
      operationId,
      endStatus: "SUCCESS",
      errorCode: null,
      errorDetail: null,
    });

    return {
      finalText: text,
      confessions,
    };
  } catch (error: unknown) {
    const errDetail = error instanceof Error
      ? error.message
      : "An unknown error occurred while running the AI pipeline.";

    const confession = createRiskFlagConfession({
      title: "An internal error occurred",
      detail: errDetail,
      truth: "Pipeline failed with error",
      what: "Failed to complete AI request",
      why: errDetail,
      how: "Pipeline execution",
      relatedStepCode: "CALL_MODEL",
      language,
      machineTags: ["error", "pipeline"],
    });

    confessions.push(confession);
    emitConfession({ operationId, confession });

    emitEnd({
      operationId,
      endStatus: "ERROR",
      errorCode: "PIPELINE_ERROR",
      errorDetail: errDetail,
    });

    return {
      finalText: "",
      confessions,
    };
  }
}
