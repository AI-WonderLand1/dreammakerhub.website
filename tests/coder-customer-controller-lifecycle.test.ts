import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const controller = read('apps/web/app/api/internal/coder/customer-usage/route.ts');

describe('disabled customer time-limit controller', () => {
  it('keeps the old authenticated scheduler endpoint harmless', () => {
    expect(controller).toContain('timingSafeEqual');
    expect(controller).toContain("{ status: 'disabled', timeLimits: false }");
    expect(controller).not.toContain('meter_coder_customer_compute_v2');
    expect(controller).not.toContain("transition: 'stop'");
    expect(controller).not.toContain('coder_customer_controller');
  });
});
