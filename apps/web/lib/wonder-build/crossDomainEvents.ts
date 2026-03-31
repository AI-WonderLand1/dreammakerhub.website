import type { TrustStatus } from './masterSchemaContract';

export type CrossDomainEventName =
  | 'level.up'
  | 'repo.push.started'
  | 'repo.push.failed'
  | 'builder.ai.applied';

export type CrossDomainEventSource = 'logic' | 'ui' | 'api' | 'worker';

export type CrossDomainEventPayloadMap = {
  'level.up': {
    level: number;
    xpDelta: number;
    message: string;
  };
  'repo.push.started': {
    projectId: string;
    branch: string;
  };
  'repo.push.failed': {
    projectId: string;
    error: string;
  };
  'builder.ai.applied': {
    blockCount: number;
    sectionCount: number;
  };
};

export type CrossDomainEvent<N extends CrossDomainEventName = CrossDomainEventName> = {
  id: string;
  name: N;
  source: CrossDomainEventSource;
  timestamp: string;
  traceId: string;
  projectId: string | null;
  payload: CrossDomainEventPayloadMap[N];
};

export type EventUiContract = {
  toast: 'loading' | 'success' | 'error' | 'info';
  trustLayerState: TrustStatus;
  retryAction?: 'push' | 'pull' | 'commit' | 'generate';
};

export const EVENT_UI_CONTRACT: Record<CrossDomainEventName, EventUiContract> = {
  'level.up': {
    toast: 'success',
    trustLayerState: 'ready',
  },
  'repo.push.started': {
    toast: 'loading',
    trustLayerState: 'loading',
  },
  'repo.push.failed': {
    toast: 'error',
    trustLayerState: 'error',
    retryAction: 'push',
  },
  'builder.ai.applied': {
    toast: 'success',
    trustLayerState: 'ready',
  },
};

export function isKnownCrossDomainEventName(name: string): name is CrossDomainEventName {
  return Object.prototype.hasOwnProperty.call(EVENT_UI_CONTRACT, name);
}
