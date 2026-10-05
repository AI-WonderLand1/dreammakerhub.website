import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace compute metering and Coder IDE safeguards', () => {
  it('retains canonical compute profiles for billing and legacy metering', () => {
    const profiles = read('apps/web/lib/coder/workspace-profiles.ts');
    expect(profiles).toContain("id: 'micro'");
    expect(profiles).toMatch(/id: 'micro',[\s\S]*?cpu: 1,[\s\S]*?memoryGiB: 2,[\s\S]*?computeMultiplier: 1,/);
    expect(profiles).toMatch(/id: 'standard',[\s\S]*?cpu: 2,[\s\S]*?memoryGiB: 4,[\s\S]*?computeMultiplier: 2,/);
    expect(profiles).toMatch(/id: 'power',[\s\S]*?cpu: 4,[\s\S]*?memoryGiB: 8,[\s\S]*?computeMultiplier: 4,/);
    expect(profiles).toMatch(/id: 'max',[\s\S]*?cpu: 8,[\s\S]*?memoryGiB: 16,[\s\S]*?computeMultiplier: 8,/);
  });

  it('keeps the legacy Railway workspace image and credentials operator-controlled', () => {
    const template = read('infra/coder/template/main.tf');
    const provision = read('apps/web/app/api/user-workspace/provision/route.ts');
    expect(template).toContain('variable "workspace_image"');
    expect(template).toContain('variable "railway_token"');
    expect(template).not.toContain('data "coder_parameter" "machine_profile"');
    expect(provision).toContain('This Coder template does not accept image overrides.');
    expect(provision).toContain("{ name: 'repo_url', value: publicRepo.fullName }");
    expect(provision).toContain("richParameterValues.push({ name: 'region', value: region })");
  });

  it('charges elapsed compute by multiplier and against one monthly user pool', () => {
    const migration = read('supabase/migrations/20260927120517_coder_customer_metering_core_20260927.sql');
    const controller = read('apps/web/app/api/internal/coder/customer-usage/route.ts');
    expect(migration).toContain('v_elapsed * v_row.compute_multiplier');
    expect(migration).toContain('coder_customer_compute_monthly');
    expect(migration).toContain('meter_coder_customer_compute_v2');
    expect(controller).toContain("db.rpc('meter_coder_customer_compute_v2'");
    expect(controller).toContain('p_monthly_limit_credits: monthlyLimit');
  });

  it('defines one compute credit as one CPU-minute in canonical plan limits', () => {
    const limits = read('apps/web/lib/billing/limits.ts');
    expect(limits).toMatch(/plan: "free",[\s\S]*?computeCreditsMonthly: 9000,[\s\S]*?runtimeHoursMonthly: 150,/);
    expect(limits).toMatch(/plan: "pro",[\s\S]*?computeCreditsMonthly: 18000,[\s\S]*?runtimeHoursMonthly: 300,/);
    expect(limits).toMatch(/plan: "team",[\s\S]*?computeCreditsMonthly: 60000,[\s\S]*?runtimeHoursMonthly: 1000,/);
  });
});
