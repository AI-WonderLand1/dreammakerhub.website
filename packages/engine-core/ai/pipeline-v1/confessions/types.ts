export type ConfessionType = 
  | "UNCERTAINTY"
  | "REJECTED_ACTION"
  | "RISK_FLAG"
  | "LIMITATION"
  | "CORRECTION"
  | "HALLUCINATION_DETECTED"
  | "TRUTH_VERIFIED";

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";

// 1. Explicitly type your three distinct agents
export type AgentName = "Alice" | "Simple Rick" | "Spirit Guide";

export interface Confession {
  agentName: AgentName; // 2. Required field inside the core interface
  type: ConfessionType;
  title: string;
  detail: string;
  truth: string;
  what: string;
  why: string;
  how: string;
  impactLevel: ImpactLevel;
  relatedStepCode?: string | null;
  machineTags?: string[];
}

export interface LocalizedConfession extends Confession {
  language: string;
}
