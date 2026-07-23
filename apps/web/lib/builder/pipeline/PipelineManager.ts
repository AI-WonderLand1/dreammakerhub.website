import { getEventBus, resetEventBus } from './EventBus';
import { EventNames } from './types';
import { builderService } from './BuilderService';
import { projectStateManager } from './ProjectStateManager';
import { fileFolderManager } from './FileFolderManager';
import { codeGenerationService } from './CodeGenerationService';
import { validationService } from './ValidationService';
import { livePreviewService } from './LivePreviewService';
import { dashboardService } from './DashboardService';
import { storageService } from './StorageService';
import { historyService } from './HistoryService';
import { analyticsService } from './AnalyticsService';
import { presenceService } from './PresenceService';
import { logger } from '@/lib/logger';

export interface PipelineConfig {
  projectId?: string;
  ownerId?: string;
  autoStart?: boolean;
  enableDashboard?: boolean;
  enablePreview?: boolean;
  enableStorage?: boolean;
  enableHistory?: boolean;
  enableAnalytics?: boolean;
  enablePresence?: boolean;
}

export class PipelineManager {
  private started = false;
  private config: Required<PipelineConfig>;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      projectId: config.projectId || '',
      ownerId: config.ownerId || '',
      autoStart: config.autoStart ?? true,
      enableDashboard: config.enableDashboard ?? true,
      enablePreview: config.enablePreview ?? true,
      enableStorage: config.enableStorage ?? true,
      enableHistory: config.enableHistory ?? true,
      enableAnalytics: config.enableAnalytics ?? true,
      enablePresence: config.enablePresence ?? true,
    };
  }

  start(): void {
    if (this.started) return;
    const bus = getEventBus();

    if (this.config.projectId) {
      projectStateManager.setProjectId(this.config.projectId);
      fileFolderManager.setProjectId(this.config.projectId);
      dashboardService.setProjectId(this.config.projectId);
      storageService.setProjectId(this.config.projectId);
    }
    if (this.config.ownerId) {
      // StorageService uses ownerId via environment; set if needed
    }

    projectStateManager.start();
    fileFolderManager.start();
    builderService.start();
    historyService.start();
    codeGenerationService.start();
    validationService.start();

    if (this.config.enablePreview) livePreviewService.start();
    if (this.config.enableDashboard) dashboardService.start();
    if (this.config.enableStorage) storageService.start();
    if (this.config.enableAnalytics) analyticsService.start();

    this.started = true;
    logger.info('[Pipeline] All services started');
    bus.emit(EventNames.SYSTEM_INFO, {
      message: 'Pipeline initialized',
      context: { config: this.config },
    });
  }

  stop(): void {
    if (!this.started) return;
    analyticsService.stop();
    storageService.stop();
    dashboardService.stop();
    livePreviewService.stop();
    validationService.stop();
    codeGenerationService.stop();
    historyService.stop();
    builderService.stop();
    fileFolderManager.stop();
    projectStateManager.stop();
    this.started = false;
    logger.info('[Pipeline] All services stopped');
  }

  restart(): void {
    this.stop();
    this.start();
  }

  getServices() {
    return {
      builderService,
      projectStateManager,
      fileFolderManager,
      codeGenerationService,
      validationService,
      livePreviewService,
      dashboardService,
      storageService,
      historyService,
      analyticsService,
      presenceService,
    };
  }

  isRunning(): boolean {
    return this.started;
  }

  getProjectId(): string {
    return this.config.projectId;
  }
}

let globalPipeline: PipelineManager | null = null;

export function getPipeline(config?: PipelineConfig): PipelineManager {
  if (!globalPipeline) {
    globalPipeline = new PipelineManager(config);
  } else if (config?.projectId && globalPipeline.getProjectId() !== config.projectId) {
    globalPipeline.stop();
    globalPipeline = new PipelineManager(config);
    if (config.autoStart !== false) globalPipeline.start();
  }
  return globalPipeline;
}

export function resetPipeline(): void {
  if (globalPipeline) {
    globalPipeline.stop();
    globalPipeline = null;
  }
  resetEventBus();
}

export function usePipeline(config?: PipelineConfig): PipelineManager {
  if (typeof window !== 'undefined') {
    const pipeline = getPipeline(config);
    if (!pipeline.isRunning() && config?.autoStart !== false) {
      pipeline.start();
    }
    return pipeline;
  }
  return new PipelineManager(config || { autoStart: false });
}
