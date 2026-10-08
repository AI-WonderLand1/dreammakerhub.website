import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const deletion = read('apps/web/app/api/user-workspace/coder/[slotId]/route.ts');
const handoff = read('apps/web/lib/coder/customer-workspace-access.server.ts');
const open = read('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');

describe('customer workspace deletion authorization', () => {
  it('binds the authenticated site user, slot, Coder identity and ready job before deletion', () => {
    expect(deletion).toContain('authenticatedSupabaseUser(request)');
    expect(deletion).toContain('getCoderSlot(user.id, slotId)');
    expect(deletion).toContain('isConfiguredCoderOperator(user.id)');
    expect(deletion).toContain('customerDeletionOwner(user.id, user.email, user.email_confirmed_at, slot.id)');
    expect(deletion).toContain('verifiedCustomerTemplate()');
    expect(deletion).not.toContain('CODER_SUPABASE_OIDC_VERIFIED');
    expect(deletion).toContain(".from('coder_customer_identities')");
    expect(deletion).toContain(".from('coder_customer_jobs')");
    expect(deletion).toContain(".eq('user_id', userId).eq('slot_id', slotId)");
    expect(deletion).toContain("job.status !== 'ready'");
    expect(deletion).toContain('identity.coder_user_id === operatorId');
    expect(deletion).toContain("owner.login_type !== 'oidc'");
    expect(deletion).toContain('owner.email?.trim().toLowerCase() !== expectedEmail');
    expect(deletion).not.toContain('body.userId');
  });



  it('releases already-deleting slots using persisted ownership after Coder confirms absence', () => {
    expect(deletion).toContain('customerDeletionReconciliationOwner');
    expect(deletion).toContain("slot.state === 'deleting'");
    expect(deletion).toContain("!UUID.test(job.template_id)");
    expect(deletion).toContain("if (current.status === 404)");
    expect(deletion).toContain("if (byName.status !== 404)");
    expect(deletion).toContain("await releaseDeletedCoderSlot(user.id, slot.id, slot.workspace_id)");
    expect(deletion).not.toContain("slot.state !== 'deleting' && workspace.latest_build?.transition !== 'delete'");
    expect(deletion).toContain("if (workspace.latest_build?.transition !== 'delete')");
  });

  it('verifies the exact remote owner and template before sending any destructive build', () => {
    const owner = deletion.indexOf('expectedOwnerId = customer.ownerId;');
    const ownership = deletion.indexOf('workspace.owner_id !== expectedOwnerId');
    const template = deletion.indexOf('workspace.template_id !== expectedTemplateId');
    const deleteBuild = deletion.indexOf("{ transition: 'delete' }");
    expect(owner).toBeGreaterThan(0);
    expect(ownership).toBeGreaterThan(owner);
    expect(template).toBeGreaterThan(owner);
    expect(deleteBuild).toBeGreaterThan(ownership);
    expect(deleteBuild).toBeGreaterThan(template);
    expect(deletion).toContain("coderApiRequest('/api/v2/users/me', 'GET')");
    expect(deletion).toContain('identity.id !== configuredId');
  });

  it('requires a second owner-scoped 404 before releasing a slot and keeps uncertain slots allocated', () => {
    const first404 = deletion.indexOf('if (current.status === 404)');
    const secondLookup = deletion.indexOf('/workspace/${encodeURIComponent(slot.workspace_name)}', first404);
    const second404 = deletion.indexOf('if (byName.status !== 404)', secondLookup);
    const release = deletion.indexOf('await releaseDeletedCoderSlot', second404);
    expect(first404).toBeGreaterThan(0);
    expect(secondLookup).toBeGreaterThan(first404);
    expect(second404).toBeGreaterThan(secondLookup);
    expect(release).toBeGreaterThan(second404);
    expect(deletion).toContain('remaining.owner_id !== expectedOwnerId');
    expect(deletion).toContain("'Cache-Control': 'private, no-store'");
  });
});

describe('customer IDE lifecycle handoff', () => {
  it('reverifies identity, template and wildcard app routing before opening', () => {
    expect(handoff).toContain('customerProvisioningGate()');
    expect(handoff).toContain('verifiedCustomerTemplateId()');
    expect(handoff).toContain('verifiedCustomerCoderOwner(user)');
    expect(handoff).not.toContain('assertFreshUsageController');
    expect(handoff).toContain("job.data.status !== 'ready'");
    expect(handoff).toContain('workspace.owner_id !== coderUserId');
    expect(handoff).toContain('workspace.template_id !== templateId');
    expect(handoff).toContain('CODER_WILDCARD_ACCESS_URL');
    expect(open).toContain("transition: 'start'");
    expect(handoff).not.toContain('CODER_API_TOKEN');
  });
});
