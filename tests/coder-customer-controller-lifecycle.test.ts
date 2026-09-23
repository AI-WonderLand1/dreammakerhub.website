import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const controller = read('apps/web/app/api/internal/coder/customer-usage/route.ts');
const schema = read('supabase/migrations/202609220945_coder_customer_jobs.sql');

describe('customer compute controller and deleted workspace accounting', () => {
  it('joins customer jobs before selecting unreleased slots, excluding operator allocations', () => {
    const active = controller.indexOf(".from('coder_workspace_slots')");
    const customerOnly = controller.indexOf('coder_customer_jobs!inner(slot_id)', active);
    const unreleased = controller.indexOf(".is('released_at', null)", customerOnly);
    const states = controller.indexOf(".in('state', ['provisioned', 'deleting'])", unreleased);
    const metered = controller.indexOf(".from('coder_customer_compute_usage')", states);
    expect(active).toBeGreaterThan(0);
    expect(customerOnly).toBeGreaterThan(active);
    expect(unreleased).toBeGreaterThan(customerOnly);
    expect(states).toBeGreaterThan(unreleased);
    expect(metered).toBeGreaterThan(states);
    expect(controller).toContain('identity.data.coder_user_id === operatorId');
    expect(controller).toContain(".in('slot_id', allocations.map((slot) => slot.id))");
    expect(controller).toContain('usage.data.length !== allocations.length');
    expect(controller).not.toContain(".select('slot_id,workspace_id,user_id,used_ms,max_ms,stop_requested_at').limit(21)");
    expect(controller).not.toContain(".delete().eq('slot_id'");
    expect(schema).toContain('used_ms bigint NOT NULL DEFAULT 0');
  });

  it('requires owner-scoped absence before skipping a workspace being deleted', () => {
    const deleting = controller.indexOf("remoteResponse.status === 404 && slot.state === 'deleting'");
    const byOwner = controller.indexOf('/workspace/${encodeURIComponent(slot.workspace_name)}', deleting);
    const confirmAbsent = controller.indexOf('if (byName.status !== 404)', byOwner);
    const skip = controller.indexOf('continue;', confirmAbsent);
    expect(deleting).toBeGreaterThan(0);
    expect(byOwner).toBeGreaterThan(deleting);
    expect(confirmAbsent).toBeGreaterThan(byOwner);
    expect(skip).toBeGreaterThan(confirmAbsent);
    expect(controller).toContain('usage.workspace_id !== slot.workspace_id');
    expect(controller).toContain('usage.user_id !== slot.user_id');
    expect(controller).toContain('remote.owner_id !== identity.data.coder_user_id');
  });

  it('keeps unreconciled jobs fail closed and meters deleting pods until absent', () => {
    expect(controller).toContain("item.status === 'needs_reconciliation'");
    expect(controller).toContain("build.transition === 'delete' && slot.state !== 'deleting'");
    expect(controller).toContain('p_running: !stoppedState');
    expect(controller).toContain("build.transition !== 'delete'");
    expect(controller).toContain(".from('coder_customer_controller').upsert(");
    expect(controller).toContain('customer creation will pause');
  });
});
