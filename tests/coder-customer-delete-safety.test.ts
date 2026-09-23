import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const deletion = read('apps/web/app/api/user-workspace/coder/[slotId]/route.ts');
const handoff = read('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');

describe('customer workspace deletion authorization', () => {
  it('binds the authenticated site user, slot, Coder identity and ready job before deletion', () => {
    expect(deletion).toContain('authenticatedSupabaseUser(request)');
    expect(deletion).toContain('getCoderSlot(user.id, slotId)');
    expect(deletion).toContain('isConfiguredCoderOperator(user.id)');
    expect(deletion).toContain('customerDeletionOwner(user.id, user.email, user.email_confirmed_at, slot.id)');
    expect(deletion).toContain("process.env.CODER_SUPABASE_OIDC_VERIFIED !== 'true'");
    expect(deletion).toContain(".from('coder_customer_identities')");
    expect(deletion).toContain(".from('coder_customer_jobs')");
    expect(deletion).toContain(".eq('user_id', userId).eq('slot_id', slotId)");
    expect(deletion).toContain("job.status !== 'ready'");
    expect(deletion).toContain('identity.coder_user_id === operatorId');
    expect(deletion).toContain("owner.login_type !== 'oidc'");
    expect(deletion).toContain('owner.email?.trim().toLowerCase() !== expectedEmail');
    expect(deletion).not.toContain('body.userId');
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
  it('fails closed until a DreamMakerHub-only gateway exists', () => {
    expect(handoff).toContain('CUSTOMER_IDE_GATEWAY_REQUIRED');
    expect(handoff).toContain('status: 503');
    expect(handoff).not.toContain('coderApiRequest(');
    expect(handoff).not.toContain('CODER_ACCESS_URL');
    expect(handoff).not.toContain("{ transition: 'start' }");
  });
});
