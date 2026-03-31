import {
  Confession,
  ConfessionType,
  ImpactLevel,
  LocalizedConfession,
} from "./types";

export interface ConfessionFactoryOptions {
  title: string;
  detail: string;
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
    relatedStepCode = null,
    machineTags = [],
    impactLevel,
  } = options;

  return {
    type,
    title,
    detail,
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
      return "HIGH";
    case "CORRECTION":
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
