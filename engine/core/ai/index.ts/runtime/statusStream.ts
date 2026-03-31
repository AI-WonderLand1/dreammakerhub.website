import { randomUUID } from "crypto";
import { ConfessionEvent, toConfessionEvent } from "../confessions/serializers";
import type { LocalizedConfession } from "../confessions/types";

/**
 * StatusEvent
 *
 * The unified event type for the AI console.
 * Everything the UI sees comes through this.
 */
export type StatusEvent =
  | ProcessStepEvent
  | ConfessionEvent
  | SummaryEvent
  | EndEvent;

/**
 * Base event fields shared by all event types.
 */
interface BaseEvent {
  operationId: string;
  eventId: string;
  timestamp: string;
  sequence: number;
}

/**
 * PROCESS_STEP event
 */
export interface ProcessStepEvent extends BaseEvent {
  eventType: "PROCESS_STEP";
  stepCode: string;
  stepLabel: string;
  stepDetail: string;
  status: "PENDING" | "RUNNING" | "DONE" | "SKIPPED" | "FAILED";
  severity: "INFO" | "WARNING" | "ERROR";
  language: string;
}

/**
 * SUMMARY event
 */
export interface SummaryEvent extends BaseEvent {
  eventType: "SUMMARY";
  shortSummary: string;
  longSummary?: string;
  language: string;
}

/**
 * END event
 */
export interface EndEvent extends BaseEvent {
  eventType: "END";
  endStatus: "SUCCESS" | "ERROR" | "ABORTED";
  errorCode?: string | null;
  errorDetail?: string | null;
}

/**
 * Internal sequence counter per operation.
 */
const sequenceCounters = new Map<string, number>();

function nextSequence(operationId: string): number {
  const current = sequenceCounters.get(operationId) ?? 0;
  const next = current + 1;
  sequenceCounters.set(operationId, next);
  return next;
}

function createBaseEvent(operationId: string): BaseEvent {
  return {
    operationId,
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    sequence: nextSequence(operationId),
  };
}

/**
 * Event listeners (subscribers)
 */
type Listener = (event: StatusEvent) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function broadcast(event: StatusEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

/**
 * Emit PROCESS_STEP
 */
export function emitProcessStep(options: {
  operationId: string;
  stepCode: string;
  stepLabel: string;
  stepDetail: string;
  status: "PENDING" | "RUNNING" | "DONE" | "SKIPPED" | "FAILED";
  severity: "INFO" | "WARNING" | "ERROR";
  language: string;
}): ProcessStepEvent {
  const event: ProcessStepEvent = {
    ...createBaseEvent(options.operationId),
    eventType: "PROCESS_STEP",
    stepCode: options.stepCode,
    stepLabel: options.stepLabel,
    stepDetail: options.stepDetail,
    status: options.status,
    severity: options.severity,
    language: options.language,
  };

  broadcast(event);
  return event;
}

/**
 * Emit CONFESSION
 */
export function emitConfession(options: {
  operationId: string;
  confession: LocalizedConfession;
  timestamp?: string;
}): ConfessionEvent {
  const event = toConfessionEvent({
    operationId: options.operationId,
    eventId: randomUUID(),
    sequence: nextSequence(options.operationId),
    confession: options.confession,
    timestamp: options.timestamp,
  });

  broadcast(event);
  return event;
}

/**
 * Emit SUMMARY
 */
export function emitSummary(options: {
  operationId: string;
  shortSummary: string;
  longSummary?: string;
  language: string;
}): SummaryEvent {
  const event: SummaryEvent = {
    ...createBaseEvent(options.operationId),
    eventType: "SUMMARY",
    shortSummary: options.shortSummary,
    longSummary: options.longSummary,
    language: options.language,
  };

  broadcast(event);
  return event;
}

/**
 * Emit END
 */
export function emitEnd(options: {
  operationId: string;
  endStatus: "SUCCESS" | "ERROR" | "ABORTED";
  errorCode?: string | null;
  errorDetail?: string | null;
}): EndEvent {
  const event: EndEvent = {
    ...createBaseEvent(options.operationId),
    eventType: "END",
    endStatus: options.endStatus,
    errorCode: options.errorCode ?? null,
    errorDetail: options.errorDetail ?? null,
  };

  broadcast(event);
  return event;
}
