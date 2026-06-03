import { LocalizedConfession } from "./types";

export interface ConfessionEvent {
  operationId: string;
  eventId: string;
  eventType: "CONFESSION";
  timestamp: string;
  sequence: number;
  language: string;
  confession: LocalizedConfession;
}

export interface ConfessionEventFactoryOptions {
  operationId: string;
  eventId: string;
  sequence: number;
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
    timestamp: opts.timestamp ?? new Date().toISOString(),
    sequence: opts.sequence,
    language: opts.confession.language,
    confession: opts.confession,
  };
}
