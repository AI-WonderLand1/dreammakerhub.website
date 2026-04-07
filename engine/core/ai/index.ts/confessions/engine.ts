import {
  Confession,
  ConfessionType,
  ImpactLevel,
  LocalizedConfession,
} from "./types";

export interface ConfessionFactoryOptions {
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

export const createUncertaintyConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("UNCERTAINTY", opts);

export const createRejectedActionConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("REJECTED_ACTION", opts);

export const createRiskFlagConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("RISK_FLAG", opts);

export const createLimitationConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("LIMITATION", opts);

export const createCorrectionConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("CORRECTION", opts);

export const createHallucinationConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("HALLUCINATION_DETECTED", opts);

export const createTruthVerifiedConfession = (
  opts: LocalizedConfessionFactoryOptions
) => createLocalizedConfession("TRUTH_VERIFIED", opts);
