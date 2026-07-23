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
import { logger } from '@/lib/logger';

export interface PipelineConfig {
  projectId?: string;
  ownerId?: string;
  autoStart?: boolean;
  enableDashboard?: boolean;
  enablePreview?: boolean;
  enableStorage?: boolean;
}

export class PipelineManager {
  private started = false;
  private config: PipelineConfig;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      autoStart: true,
      enableDashboard: true,
      enablePreview: true,
      enableStorage: true,
      ...config,
    };
  }

  start(): void {
    if (this.started) return;
    const bus = getEventBus();

    // Configure project IDs
    if (this.config.projectId) {
      projectStateManager.setProjectId(this.config.projectId);
      fileFolderManager.setProjectId(this.config.projectId);
      dashboardService.setProjectId(this.config.projectId);
      storageService.setProjectId(this.config.projectId);
    }
    if (this.config.ownerId) {
      storageService.setOwnerId(this.config.ownerId);
    }

    // Start all services (order matters)
    projectStateManager.start();
    fileFolderManager.start();
    builderService.start();
    codeGenerationService.start();
    validationService.start();

    if (this.config.enablePreview) {
      livePreviewService.start();
    }
    if (this.config.enableDashboard) {
      dashboardService.start();
    }
    if (this.config.enableStorage) {
      storageService.start();
    }

    this.started = true;

    logger.info('[Pipeline] All services started');
    bus.emit(EventNames.SYSTEM_INFO, {
      message: 'Pipeline initialized with all services',
      context: { config: this.config },
    });
  }

  stop(): void {
    if (!this.started) return;
    builderService.stop();
    projectStateManager.stop();
    fileFolderManager.stop();
    codeGenerationService.stop();
    validationService.stop();
    livePreviewService.stop();
    dashboardService.stop();
    storageService.stop();
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
    };
  }

  isRunning(): boolean {
    return this.started;
  }
}

// Singleton
let globalPipeline: PipelineManager | null = null;

export function getPipeline(config?: PipelineConfig): PipelineManager {
  if (!globalPipeline) {
    globalPipeline = new PipelineManager(config);
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

// React hook
export function usePipeline(config?: PipelineConfig): PipelineManager {
  if (typeof window !== 'undefined') {
    const pipeline = getPipeline(config);
    if (!pipeline.isRunning() && config?.autoStart !== false) {
      pipeline.start();
    }
    return pipeline;
  }
  return new PipelineManager(config);
}
