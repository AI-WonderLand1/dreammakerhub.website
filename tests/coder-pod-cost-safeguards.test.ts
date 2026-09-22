import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Coder allocated workspace cost guard', () => {
  it('reserves an allocation atomically, counts stopped PVCs, and denies anonymous database access', () => {
    const sql = read('supabase/migrations/202609202100_coder_workspace_slots.sql');
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('WHERE user_id = p_user_id AND released_at IS NULL');
    expect(sql).toContain('coder_workspace_slots_unreleased_name');
    expect(sql).toContain('coder_api_origin text NOT NULL');
    expect(sql).toContain('REVOKE ALL ON TABLE public.coder_workspace_slots FROM PUBLIC, anon, authenticated');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.reserve_coder_workspace_slot(uuid, text, text, integer) TO service_role');
    expect(sql).not.toContain('expires_at');
  });

  it('validates size on the server and reserves only after validation but before Coder create', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    const guard = read('apps/web/lib/coder/workspace-slots.server.ts');
    const options = read('apps/web/app/api/user-workspace/options/route.ts');
    expect(route.indexOf('assertCoderResourceBudget(cpu, memory)')).toBeLessThan(route.indexOf('await reserveCoderSlot('));
    expect(route.indexOf('await reserveCoderSlot(')).toBeLessThan(route.indexOf('await coder.createWorkspace('));
    expect(route).toContain('await attachCoderWorkspace(user.id, slotId, workspace.id)');
    expect(route).not.toContain('reserveWorkspaceLaunch(');
    expect(guard).toContain('MAX_CODER_CPU = 2');
    expect(guard).toContain('MAX_CODER_MEMORY_GIB = 4');
    expect(guard).toContain('CODER_DISK_GIB = 10');
    expect(guard).toContain('CODER_TTL_MS = 60 * 60 * 1000');
    expect(guard).toContain('p_origin: coderApiConfig().url');
    expect(options).toContain('Number(option.value) <= MAX_CODER_CPU');
    expect(options).toContain('Number(option.value) <= MAX_CODER_MEMORY_GIB');
  });

  it('requires ownership and confirmed deletion, not a queued transition or changed server', () => {
    const route = read('apps/web/app/api/user-workspace/coder/[slotId]/route.ts');
    const guard = read('apps/web/lib/coder/workspace-slots.server.ts');
    expect(guard).toContain(".eq('user_id', userId).eq('id', slotId)");
    expect(route).toContain('slot.coder_api_origin !== coderApiConfig().url');
    expect(route).toContain("coderApiRequest('/api/v2/buildinfo', 'GET')");
    expect(route).toContain("{ transition: 'delete' }");
    expect(route).toContain('verification.status === 404');
    expect(route.indexOf('verification.status === 404')).toBeLessThan(route.lastIndexOf('await releaseDeletedCoderSlot('));
    expect(route).toContain('status: 202');
    expect(route).not.toContain("method: 'DELETE'");
  });

  it('enforces Coder-side limits even when someone bypasses the website', () => {
    for (const path of ['infra/coder/template/cost-guard.tf', 'infra/coder/templates/playcanvas-3d/cost-guard.tf']) {
      const template = read(path);
      expect(template).toContain('var.namespace == "coder-workspaces"');
      expect(template).toContain('tonumber(data.coder_parameter.cpu.value) <= 2');
      expect(template).toContain('tonumber(data.coder_parameter.memory.value) <= 4');
      expect(template).toContain('tonumber(data.coder_parameter.home_disk_size.value) == 10');
    }
    const quota = read('deploy/k8s/coder-workspace-cost-guard.yaml');
    expect(quota).toContain('kind: ResourceQuota');
    expect(quota).toContain('pods: "5"');
    expect(quota).toContain('persistentvolumeclaims: "5"');
    expect(quota).toContain('requests.storage: 50Gi');
    expect(quota).toContain('ephemeral-storage: 2Gi');
    expect(quota).toContain('namespace: coder-workspaces');
  });
});
