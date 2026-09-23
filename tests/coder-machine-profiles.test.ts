import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace weighted machine profiles', () => {
  it('offers the four approved CPU/RAM shapes with proportional compute multipliers', () => {
    const profiles = read('apps/web/lib/coder/workspace-profiles.ts');
    expect(profiles).toContain("id: 'micro'");
    expect(profiles).toMatch(/id: 'micro',[\s\S]*?cpu: 1,[\s\S]*?memoryGiB: 2,[\s\S]*?computeMultiplier: 1,/);
    expect(profiles).toMatch(/id: 'standard',[\s\S]*?cpu: 2,[\s\S]*?memoryGiB: 4,[\s\S]*?computeMultiplier: 2,/);
    expect(profiles).toMatch(/id: 'power',[\s\S]*?cpu: 4,[\s\S]*?memoryGiB: 8,[\s\S]*?computeMultiplier: 4,/);
    expect(profiles).toMatch(/id: 'max',[\s\S]*?cpu: 8,[\s\S]*?memoryGiB: 16,[\s\S]*?computeMultiplier: 8,/);
  });

  it('accepts a profile id from the browser but derives CPU, RAM and multiplier on the server', () => {
    const form = read('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
    const provision = read('apps/web/lib/coder/customer-provisioning.server.ts');
    expect(form).toContain('JSON.stringify({ workspaceName, machineProfile })');
    expect(form).not.toContain('JSON.stringify({ workspaceName, cpu, memory })');
    expect(provision).toContain('workspaceProfile(body.machineProfile)');
    expect(provision).toContain('cpu: profile.cpu');
    expect(provision).toContain('memory_gib: profile.memoryGiB');
    expect(provision).toContain('compute_multiplier: profile.computeMultiplier');
  });

  it('passes one immutable machine profile into the customer Coder template', () => {
    const runner = read('apps/web/app/api/internal/coder/customer-runner/route.ts');
    const template = read('infra/coder/customer-template/main.tf');
    expect(runner).toContain("{ name: 'machine_profile', value: job.machine_profile }");
    expect(runner).not.toContain("{ name: 'cpu', value: String(job.cpu) }");
    expect(template).toContain('data "coder_parameter" "machine_profile"');
    expect(template).toContain('Micro · 1 CPU / 2 GB · 1x compute');
    expect(template).toContain('Max · 8 CPU / 16 GB · 8x compute');
  });

  it('charges elapsed compute by multiplier and against one monthly user pool', () => {
    const migration = read('supabase/migrations/202609230500_coder_machine_profiles.sql');
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
