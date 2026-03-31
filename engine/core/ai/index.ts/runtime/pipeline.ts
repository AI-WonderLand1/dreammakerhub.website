import { runModel } from "../../runModel";
import {
  emitProcessStep,
  emitConfession,
  emitSummary,
  emitEnd,
} from "./statusStream";
import { evaluateAgainstConstitution } from "../constitutional/evaluator";
import { createRiskFlagConfession, createUncertaintyConfession } from "../confessions/engine";
import type { LocalizedConfession } from "../confessions/types";

interface PipelineOptions {
  operationId: string;
  userPrompt: string;
  language: string; // "en", "es", "egy-X-wonderland", etc.
  model: string;    // e.g. "google:gemini-pro" or "openrouter:anthropic/claude-3"
}

export interface PipelineResult {
  finalText: string;
  confessions: LocalizedConfession[];
}

export async function runAIPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const { operationId, userPrompt, language, model } = options;
  const confessions: LocalizedConfession[] = [];

  try {
    // 1. Step: prepare + send to model
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
      prompt: userPrompt,
      // extend as needed to match your runModel signature
    });

    const text =
      (modelResponse as any)?.text ??
      (modelResponse as any)?.output ??
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

    // 1a. Uncertainty confession if output looks weak/empty
    if (!text || text.trim().length < 5) {
      const confession = createUncertaintyConfession({
        title: "I am not confident in this answer",
        detail: "The model returned a very short or empty response.",
        relatedStepCode: "CALL_MODEL",
        language,
        machineTags: ["uncertainty", "low-confidence"],
      });

      confessions.push(confession);
      emitConfession({ operationId, confession });
    }

    // 2. Step: constitutional evaluation
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
          relatedStepCode: "CONSTITUTIONAL_CHECK",
          language,
          machineTags: ["constitutional", "risk", violation.ruleId],
        });

        confessions.push(confession);
        emitConfession({
          operationId,
          confession,
        });
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

    // 4. Summary event
    emitSummary({
      operationId,
      shortSummary: "AI response generated and checked.",
      longSummary:
        violations.length === 0
          ? "The AI produced a response and no rule violations were detected."
          : `The AI produced a response. ${violations.length} potential rule violations were detected and reported via confessions.`,
      language,
    });

    // 5. End event
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
  } catch (error: any) {
    // Error handling confession
    const errDetail =
      typeof error?.message === "string"
        ? error.message
        : "An unknown error occurred while running the AI pipeline.";

    const confession = createRiskFlagConfession({
      title: "An internal error occurred",
      detail: errDetail,
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
