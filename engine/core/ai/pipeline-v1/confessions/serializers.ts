import { LocalizedConfession } from "./types";

// 1. Define the supported agent names for type safety
export type AgentName = "Alice" | "Simple Rick" | "Spirit Guide";

export interface ConfessionEvent {
  operationId: string;
  eventId: string;
  eventType: "CONFESSION";
  agentName?: AgentName; // 2. Added so your pipeline can quickly sort logs by agent
  timestamp: string;
  sequence: number;
  language: string;
  confession: LocalizedConfession;
}

export interface ConfessionEventFactoryOptions {
  operationId: string;
  eventId: string;
  sequence: number;
  agentName?: AgentName; // 3. Added to factory incoming options
  confession: LocalizedConfession;
  timestamp?: string;
}

export function toConfessionEvent(
  opts: ConfessionEventFactoryOptions
): ConfessionEvent {
  return {
    operationId: opts.operationId,
    eventId: opts.eventId,
    eventType: "CONFESSION",
    agentName: opts.agentName || (opts.confession.agentName as AgentName), // 4. Fallback to extracting it directly from the inner confession structure
    timestamp: opts.timestamp ?? new Date().toISOString(),
    sequence: opts.sequence,
    language: opts.confession.language,
    confession: opts.confession,
  };
}
