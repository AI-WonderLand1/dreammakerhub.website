import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('GitHub Actions managed server-only memory environment', () => {
  for (const path of ['.github/workflows/deploy-upcloud.yml', '.github/workflows/deploy-aws-fallback.yml']) {
    it(`forwards optional Mem0 and MongoDB server-only settings in ${path}`, () => {
      const workflow = read(path);
      expect(workflow).toContain('MEM0AI_API_KEY: ${{ secrets.MEM0AI_API_KEY || secrets.MEM0_API_KEY }}');
      expect(workflow).toContain('MONGODB_URI: ${{ secrets.MONGODB_URI }}');
      expect(workflow).toContain("MONGODB_DB: ${{ vars.MONGODB_DB || 'dreammakerhub' }}");
      expect(workflow).toContain("MONGODB_AI_MEMORY_ENABLED: ${{ vars.MONGODB_AI_MEMORY_ENABLED || 'false' }}");
      for (const key of ['MEM0AI_API_KEY', 'MONGODB_URI', 'MONGODB_DB', 'MONGODB_AI_MEMORY_ENABLED']) {
        expect(workflow).toContain(`write_env ${key} "$${key}"`);
        expect(workflow).not.toContain(`NEXT_PUBLIC_${key}`);
      }
    });
  }

  it('does not activate MongoDB conversation archiving unless explicitly opted in', () => {
    const code = read('apps/web/lib/ai/mongoMemory.server.ts');
    expect(code).toContain("process.env.MONGODB_AI_MEMORY_ENABLED === 'true'");
  });
});
