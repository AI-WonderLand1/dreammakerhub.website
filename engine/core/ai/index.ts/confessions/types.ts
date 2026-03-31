export type ConfessionType =
  | "UNCERTAINTY"
  | "REJECTED_ACTION"
  | "RISK_FLAG"
  | "LIMITATION"
  | "CORRECTION";

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Confession {
  type: ConfessionType;
  title: string;
  detail: string;
  impactLevel: ImpactLevel;
  relatedStepCode?: string | null;
  machineTags?: string[];
}

export interface LocalizedConfession extends Confession {
  language: string;
}
