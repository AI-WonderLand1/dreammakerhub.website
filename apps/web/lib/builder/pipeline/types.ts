import type { CanvasElement, CanvasElementStyles } from '../types';

export const EventNames = {
  ELEMENT_ADDED: 'builder:element:added',
  ELEMENT_REMOVED: 'builder:element:removed',
  ELEMENT_UPDATED: 'builder:element:updated',
  ELEMENT_STYLES_CHANGED: 'builder:element:styles-changed',
  ELEMENT_SELECTED: 'builder:element:selected',
  ELEMENT_DUPLICATED: 'builder:element:duplicated',
  ELEMENT_MOVED: 'builder:element:moved',
  ELEMENTS_REORDERED: 'builder:elements:reordered',
  ELEMENTS_CLEARED: 'builder:elements:cleared',
  PROJECT_STATE_CHANGED: 'project:state-changed',
  PROJECT_METADATA_UPDATED: 'project:metadata-updated',
  PROJECT_LOADED: 'project:loaded',
  FILE_CREATED: 'file:created',
  FILE_UPDATED: 'file:updated',
  FILE_DELETED: 'file:deleted',
  FILE_RENAMED: 'file:renamed',
  FOLDER_CREATED: 'folder:created',
  FOLDER_DELETED: 'folder:deleted',
  CODE_GENERATED: 'code:generated',
  CODE_GENERATION_STARTED: 'code:generation:started',
  CODE_GENERATION_FAILED: 'code:generation:failed',
  VALIDATION_STARTED: 'validation:started',
  VALIDATION_COMPLETED: 'validation:completed',
  VALIDATION_FAILED: 'validation:failed',
  VALIDATION_ISSUE: 'validation:issue',
  PREVIEW_UPDATED: 'preview:updated',
  PREVIEW_RELOAD: 'preview:reload',
  DASHBOARD_STATS_UPDATED: 'dashboard:stats-updated',
  DASHBOARD_SYNC: 'dashboard:sync',
  AI_ACTIVITY: 'ai:activity',
  AI_GENERATION_STARTED: 'ai:generation:started',
  AI_GENERATION_COMPLETED: 'ai:generation:completed',
  STORAGE_SAVING: 'storage:saving',
  STORAGE_SAVED: 'storage:saved',
  STORAGE_LOADED: 'storage:loaded',
  STORAGE_ERROR: 'storage:error',
  HISTORY_UNDO: 'history:undo',
  HISTORY_REDO: 'history:redo',
  HISTORY_SNAPSHOT: 'history:snapshot',
  HISTORY_CLEAR: 'history:clear',
  ANALYTICS_TRACK: 'analytics:track',
  ANALYTICS_FLUSH: 'analytics:flush',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SYNC: 'presence:sync',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_WARNING: 'system:warning',
  SYSTEM_INFO: 'system:info',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];

export interface ElementAddedPayload {
  element: CanvasElement;
  parentId?: string;
  index?: number;
}

export interface ElementRemovedPayload {
  elementId: string;
  element: CanvasElement;
  parentId?: string;
}

export interface ElementUpdatedPayload {
  elementId: string;
  props: Record<string, any>;
  previousProps: Record<string, any>;
}

export interface ElementStylesChangedPayload {
  elementId: string;
  styles: Partial<CanvasElementStyles>;
  previousStyles: Partial<CanvasElementStyles>;
}

export interface ElementDuplicatedPayload {
  originalId: string;
  newElement: CanvasElement;
}

export interface ElementMovedPayload {
  elementId: string;
  fromParentId?: string;
  toParentId?: string;
  fromIndex: number;
  toIndex: number;
}

export interface FileCreatedPayload {
  path: string;
  content: string;
  projectId: string;
}

export interface FileUpdatedPayload {
  path: string;
  content: string;
  previousContent: string;
  projectId: string;
}

export interface FileDeletedPayload {
  path: string;
  projectId: string;
}

export interface FileRenamedPayload {
  oldPath: string;
  newPath: string;
  projectId: string;
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
}

export interface ValidationCompletedPayload {
  passed: boolean;
  issues: ValidationIssue[];
  duration: number;
}

export interface CodeGeneratedPayload {
  files: Array<{ path: string; content: string }>;
  affectedElements: string[];
  duration: number;
}

export interface PreviewUpdatedPayload {
  html: string;
  css: string;
  js: string;
  files: Array<{ path: string; content: string }>;
}

export interface DashboardStatsPayload {
  elementCount: number;
  pageCount: number;
  fileCount: number;
  storageUsage: number;
  validationStatus: 'idle' | 'validating' | 'passed' | 'failed';
  lastSaved: string | null;
  aiActivity: boolean;
  projectHealth: 'healthy' | 'warning' | 'error';
}

export interface AIActivityPayload {
  type: string;
  label: string;
  status: 'running' | 'done' | 'error';
  message: string;
  ts: number;
}

export interface HistorySnapshotPayload {
  elements: CanvasElement[];
  label?: string;
}

export interface PresenceUserPayload {
  userId: string;
  userName: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedElementId?: string | null;
  lastActivity: number;
}

export interface AnalyticsEventPayload {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export type EventPayloadMap = {
  [EventNames.ELEMENT_ADDED]: ElementAddedPayload;
  [EventNames.ELEMENT_REMOVED]: ElementRemovedPayload;
  [EventNames.ELEMENT_UPDATED]: ElementUpdatedPayload;
  [EventNames.ELEMENT_STYLES_CHANGED]: ElementStylesChangedPayload;
  [EventNames.ELEMENT_SELECTED]: { elementId: string | null };
  [EventNames.ELEMENT_DUPLICATED]: ElementDuplicatedPayload;
  [EventNames.ELEMENT_MOVED]: ElementMovedPayload;
  [EventNames.ELEMENTS_REORDERED]: { elementIds: string[] };
  [EventNames.ELEMENTS_CLEARED]: { previousCount: number };
  [EventNames.PROJECT_STATE_CHANGED]: { elements: CanvasElement[] };
  [EventNames.PROJECT_METADATA_UPDATED]: { key: string; value: any };
  [EventNames.PROJECT_LOADED]: { elements: CanvasElement[]; projectId: string };
  [EventNames.FILE_CREATED]: FileCreatedPayload;
  [EventNames.FILE_UPDATED]: FileUpdatedPayload;
  [EventNames.FILE_DELETED]: FileDeletedPayload;
  [EventNames.FILE_RENAMED]: FileRenamedPayload;
  [EventNames.FOLDER_CREATED]: { path: string; projectId: string };
  [EventNames.FOLDER_DELETED]: { path: string; projectId: string };
  [EventNames.CODE_GENERATED]: CodeGeneratedPayload;
  [EventNames.CODE_GENERATION_STARTED]: { elementIds: string[] };
  [EventNames.CODE_GENERATION_FAILED]: { error: string };
  [EventNames.VALIDATION_STARTED]: { files: string[] };
  [EventNames.VALIDATION_COMPLETED]: ValidationCompletedPayload;
  [EventNames.VALIDATION_FAILED]: { error: string };
  [EventNames.VALIDATION_ISSUE]: ValidationIssue;
  [EventNames.PREVIEW_UPDATED]: PreviewUpdatedPayload;
  [EventNames.PREVIEW_RELOAD]: { full: boolean };
  [EventNames.DASHBOARD_STATS_UPDATED]: DashboardStatsPayload;
  [EventNames.DASHBOARD_SYNC]: { force: boolean };
  [EventNames.AI_ACTIVITY]: AIActivityPayload;
  [EventNames.AI_GENERATION_STARTED]: { prompt: string };
  [EventNames.AI_GENERATION_COMPLETED]: { result: string; duration: number };
  [EventNames.STORAGE_SAVING]: { projectId: string };
  [EventNames.STORAGE_SAVED]: { projectId: string; timestamp: number; revision?: boolean };
  [EventNames.STORAGE_LOADED]: { projectId: string; elements?: CanvasElement[]; theme?: any; activeBreakpoint?: any; zoom?: number; pan?: { x: number; y: number }; showGrid?: boolean; snapToGrid?: boolean };
  [EventNames.STORAGE_ERROR]: { projectId: string; error: string };
  [EventNames.HISTORY_UNDO]: { elements: CanvasElement[] };
  [EventNames.HISTORY_REDO]: { elements: CanvasElement[] };
  [EventNames.HISTORY_SNAPSHOT]: HistorySnapshotPayload;
  [EventNames.HISTORY_CLEAR]: {};
  [EventNames.ANALYTICS_TRACK]: AnalyticsEventPayload;
  [EventNames.ANALYTICS_FLUSH]: { events: AnalyticsEventPayload[] };
  [EventNames.PRESENCE_JOINED]: PresenceUserPayload;
  [EventNames.PRESENCE_LEFT]: { userId: string };
  [EventNames.PRESENCE_UPDATE]: PresenceUserPayload;
  [EventNames.PRESENCE_SYNC]: { users: PresenceUserPayload[] };
  [EventNames.SYSTEM_ERROR]: { message: string; context?: any };
  [EventNames.SYSTEM_WARNING]: { message: string; context?: any };
  [EventNames.SYSTEM_INFO]: { message: string; context?: any };
};

export type EventPayload<N extends EventName> = N extends keyof EventPayloadMap ? EventPayloadMap[N] : never;

export interface EventEnvelope<N extends EventName = EventName> {
  name: N;
  payload: EventPayload<N>;
  timestamp: number;
  transactionId?: string;
  source: string;
}

export type EventHandler<N extends EventName> = (event: EventEnvelope<N>) => void;
export type WildcardHandler = (event: EventEnvelope) => void;
export type Unsubscribe = () => void;

export interface Transaction {
  id: string;
  events: EventEnvelope[];
  status: 'pending' | 'committed' | 'rolled-back';
  createdAt: number;
  rollbackActions: Array<() => void>;
}
