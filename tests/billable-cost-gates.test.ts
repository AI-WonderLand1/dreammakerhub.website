import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('platform-funded cost guards', () => {
  it('denies usage when accounting is disabled or unavailable and reserves atomically', () => {
    const guard = read('apps/web/lib/billing/cost-guard.server.ts');
    const migration = read('supabase/migrations/202609201800_atomic_billable_usage.sql');
    expect(guard).toContain("process.env.BILLABLE_OPERATIONS_ENABLED !== 'true'");
    expect(guard).toContain("client.rpc('reserve_billable_units'");
    expect(guard).toContain('if (error || typeof data !== \'boolean\')');
    expect(guard).toContain(".select('plan,status,stripe_subscription_id')");
    expect(guard).toContain("subscription.stripe_subscription_id.startsWith('sub_')");
    expect(migration).toContain('units <= p_limit - p_units');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.reserve_billable_units(uuid, text, integer, integer) TO service_role');
  });

  it('reserves usage before model and Coder workspace creation', () => {
    const ai = read('apps/web/app/api/ai/route.ts');
    const agent = read('apps/web/app/api/agent/route.ts');
    const proxy = read('apps/web/app/api/openrouter/chat/route.ts');
    const coder = read('apps/web/app/api/user-workspace/provision/route.ts');
    expect(ai.indexOf('await reserveAiRequest(')).toBeLessThan(ai.indexOf('await runModel('));
    expect(agent.indexOf('await reserveAgentRequest(')).toBeLessThan(agent.indexOf('await runModel('));
    expect(proxy.indexOf('await reserveAiRequest(')).toBeLessThan(proxy.indexOf("fetch('https://openrouter.ai"));
    expect(proxy).toContain('allowedModels.includes(model)');
    expect(coder.indexOf('await reserveWorkspaceLaunch(')).toBeLessThan(coder.indexOf('await coder.createWorkspace('));
    expect(read('apps/web/lib/billing/cost-guard.server.ts')).toContain("process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true'");
  });

  it('blocks the known alternate unmetered AI routes and limits builder project inserts', () => {
    const middleware = read('apps/web/middleware.ts');
    const migration = read('supabase/migrations/202609201810_builder_project_quota.sql');
    expect(middleware).toContain('isUnmeteredBillablePath(pathname)');
    expect(middleware).toContain('pathname.startsWith(\'/api/ai/\')');
    expect(middleware).toContain('"/api/build/stream"');
    expect(middleware).toContain('"/api/chat"');
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('BEFORE INSERT ON public._projects');
    expect(migration).toContain('PROJECT_LIMIT_REACHED');
  });
});
