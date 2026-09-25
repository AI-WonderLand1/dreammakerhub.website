import { describe, expect, it } from 'vitest';
import { getPipeline, resetPipeline } from '../apps/web/lib/builder/pipeline/PipelineManager';

describe('WonderBuild project pipeline routing', () => {
  it('drops the previous project association when returning to blank editor', () => {
    try {
      const previous = getPipeline({ projectId: 'previous-project', autoStart: false });
      expect(previous.getProjectId()).toBe('previous-project');
      const blank = getPipeline({ projectId: '', autoStart: false });
      expect(blank).not.toBe(previous);
      expect(blank.getProjectId()).toBe('');
      expect(blank.isRunning()).toBe(false);
    } finally {
      resetPipeline();
    }
  });
});
