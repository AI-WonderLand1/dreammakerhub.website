export type ConfessionType = 
  | "UNCERTAINTY"
  | "REJECTED_ACTION"
  | "RISK_FLAG"
  | "LIMITATION"
  | "CORRECTION"
  | "HALLUCINATION_DETECTED"
  | "TRUTH_VERIFIED";

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Confession {
  type: ConfessionType;
  title: string;
  detail: string;
  truth: string;
  what: string;
  why: string;
  how: string;
  impactLevel: ImpactLevel;
  relatedStepCode?: string | null; // Matched to relatedStepCode? in your screenshot
  machineTags?: string[];          // Matched to machineTags? in your screenshot
}

export interface LocalizedConfession extends Confession {
  language: string;
}
