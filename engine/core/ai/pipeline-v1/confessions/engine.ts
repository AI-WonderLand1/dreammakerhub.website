import {
  Confession,
  ConfessionType,
  ImpactLevel,
  LocalizedConfession,
  AgentName, // Imported from your updated types file
} from "./types";

export interface ConfessionFactoryOptions {
  agentName: AgentName; // Added to factory options
  title: string;
  detail: string;
  truth: string;
  what: string;
  why: string;
  how: string;
  relatedStepCode?: string | null;
  machineTags?: string[];
  impactLevel?: ImpactLevel;
}

export interface LocalizedConfessionFactoryOptions
  extends ConfessionFactoryOptions {
  language: string;
}

export function createConfession(
  type: ConfessionType,
  options: ConfessionFactoryOptions
): Confession {
  const {
    agentName,
    title,
    detail,
    truth,
    what,
    why,
    how,
    relatedStepCode = null,
    machineTags = [],
    impactLevel,
  } = options;

  return {
    agentName, // Track whether it's Alice, Simple Rick, or Spirit Guide
    type,
    title,
    detail,
    truth: truth || detail,
    what: what || "",
    why: why || "",
    how: how || "",
    relatedStepCode,
    machineTags,
    impactLevel: impactLevel ?? getDefaultImpactLevel(type),
  };
}

export function createLocalizedConfession(
  type: ConfessionType,
  options: LocalizedConfessionFactoryOptions
): LocalizedConfession {
  return {
    ...createConfession(type, options),
    language: options.language,
  };
}

function getDefaultImpactLevel(type: ConfessionType): ImpactLevel {
  switch (type) {
    case "RISK_FLAG":
    case "REJECTED_ACTION":
    case "HALLUCINATION_DETECTED":
      return "HIGH";
    case "CORRECTION":
    case "TRUTH_VERIFIED":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

// Global factory helper methods
export const createUncertaintyConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("UNCERTAINTY", opts);
export const createRejectedActionConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("REJECTED_ACTION", opts);
export const createRiskFlagConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("RISK_FLAG", opts);
export const createLimitationConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("LIMITATION", opts);
export const createCorrectionConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("CORRECTION", opts);
export const createHallucinationConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("HALLUCINATION_DETECTED", opts);
export const createTruthVerifiedConfession = (opts: LocalizedConfessionFactoryOptions) => createLocalizedConfession("TRUTH_VERIFIED", opts);

// Outbound Webhook Stream
export async function streamConfessionToPipeline(confession: Confession | LocalizedConfession) {
  const pipelineWebhookUrl = process.env.NEXT_PUBLIC_PIPELINE_WEBHOOK_URL || 'YOUR_BACKEND_PIPELINE_ENDPOINT';

  try {
    const response = await fetch(pipelineWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: "execution_pipeline",
        timestamp: new Date().toISOString(),
        payload: confession // Now holds the agentName natively
      })
    });
    return response.ok;
  } catch (error) {
    console.error("[Pipeline Error] Failed to stream data:", error);
    return false;
  }
}
