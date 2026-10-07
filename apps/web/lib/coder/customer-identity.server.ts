import 'server-only';
import type { User } from '@supabase/supabase-js';
import { CostGateError } from '@/lib/billing/cost-guard.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { coderApiRequest, coderServiceClient } from '@/lib/coder/workspace-slots.server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type CoderUser = {
  id: string;
  email: string;
  username: string;
  login_type: string;
  status: string;
  is_service_account?: boolean;
};

type CoderUsers = { users: CoderUser[] };

/**
 * Never treat a Supabase user ID as a Coder user ID, or use `me`/the admin
 * token's Coder account as a customer owner. Both sides must authenticate via
 * the same verified Supabase OIDC issuer, configured and tested separately.
 */
export async function coderOidcEnabled(): Promise<boolean> {
  const response = await coderApiRequest('/api/v2/users/authmethods', 'GET');
  if (!response.ok) return false;
  return (await response.json().catch(() => null))?.oidc?.enabled === true;
}

export async function verifiedCustomerCoderOwner(user: User): Promise<string> {
  if (!user.email || !user.email_confirmed_at || !UUID.test(user.id)) {
    throw new CostGateError('A confirmed DreamMakerHub account is required.', 402);
  }
  if (isConfiguredCoderOperator(user.id)) {
    throw new CostGateError('The operator account cannot be enrolled as a customer.');
  }
  const expectedEmail = user.email.trim().toLowerCase();
  if (!(await coderOidcEnabled())) {
    throw new CostGateError('Coder customer OIDC login is not enabled.');
  }
  const findCustomer = async (): Promise<{ exact: CoderUser[]; eligible: CoderUser[] }> => {
    const response = await coderApiRequest(`/api/v2/users?q=${encodeURIComponent(expectedEmail)}&limit=100`, 'GET');
    if (!response.ok) throw new CostGateError('Coder customer identity lookup is unavailable.');
    const body = await response.json().catch(() => null) as CoderUsers | null;
    if (!body || !Array.isArray(body.users)) throw new CostGateError('Coder returned an invalid user list.');

    const exact = body.users.filter((candidate) =>
      candidate.email?.trim().toLowerCase() === expectedEmail);
    const eligible = exact.filter((candidate) =>
      candidate.login_type === 'oidc' && candidate.status === 'active' &&
      candidate.is_service_account !== true && UUID.test(candidate.id));
    return { exact, eligible };
  };

  let { exact, eligible } = await findCustomer();

  if (eligible.length > 1) {
    throw new CostGateError('Multiple Coder OIDC accounts use this email. Contact support; no workspace was created.');
  }

  // A verified AI WONDERLAND account should not have to visit the Coder
  // dashboard before requesting its first IDE. Pre-enroll a normal OIDC user
  // through the operator API, then independently re-read and verify it below.
  if (eligible.length === 0) {
    if (exact.length > 0) {
      throw new CostGateError('A conflicting Coder account already uses this email. Contact support; no workspace was created.');
    }

    const username = `aw-${user.id.replaceAll('-', '').slice(0, 16)}`;
    const organizationId = process.env.CODER_ORG_ID;
    if (!organizationId || !UUID.test(organizationId)) {
      throw new CostGateError('Coder customer organization is not configured.');
    }

    const created = await coderApiRequest('/api/v2/users', 'POST', {
      email: expectedEmail,
      username,
      login_type: 'oidc',
      user_status: 'active',
      service_account: false,
      organization_ids: [organizationId],
    });

    if (!created.ok && created.status !== 409) {
      const failure = await created.json().catch(() => null) as { message?: unknown; detail?: unknown } | null;
      console.error('[coder-customer-enrollment] create user failed', {
        status: created.status,
        message: typeof failure?.message === 'string' ? failure.message : undefined,
        detail: typeof failure?.detail === 'string' ? failure.detail : undefined,
      });
      throw new CostGateError('Coder customer enrollment is unavailable.');
    }

    // Re-query even after a successful create. This also handles a concurrent
    // request that won the unique-email race and caused a 409.
    ({ eligible } = await findCustomer());
    if (eligible.length !== 1) {
      throw new CostGateError('Coder customer enrollment could not be verified.');
    }
  }

  const coderUser = eligible[0];
  const operatorCoderId = process.env.CODER_OPERATOR_USER_ID;
  if (!operatorCoderId || !UUID.test(operatorCoderId) || coderUser.id === operatorCoderId) {
    throw new CostGateError('Coder operator and customer identities are not safely separated.');
  }
  // The full user record must still agree. A search hit alone is not proof.
  const detail = await coderApiRequest(`/api/v2/users/${encodeURIComponent(coderUser.id)}`, 'GET');
  const actual = detail.ok ? await detail.json().catch(() => null) as CoderUser | null : null;
  if (!actual || actual.id !== coderUser.id || actual.email?.trim().toLowerCase() !== expectedEmail ||
      actual.login_type !== 'oidc' || actual.status !== 'active' || actual.is_service_account === true) {
    throw new CostGateError('Coder identity could not be independently verified.');
  }
  const db = coderServiceClient();
  const { data: existing, error: lookupError } = await db.from('coder_customer_identities')
    .select('coder_user_id,verified_email').eq('user_id', user.id).maybeSingle();
  if (lookupError) throw new CostGateError('Customer identity mapping is unavailable.');
  if (existing) {
    if (existing.coder_user_id !== actual.id || existing.verified_email !== expectedEmail) {
      throw new CostGateError('Coder account mapping changed. Contact support; no workspace was created.');
    }
  } else {
    // Unique constraints on both IDs stop concurrent requests from claiming an
    // existing Coder identity. Never reassign someone else's owner ID.
    const { error: insertError } = await db.from('coder_customer_identities').insert({
      user_id: user.id, coder_user_id: actual.id, verified_email: expectedEmail,
    });
    if (insertError) throw new CostGateError('Could not bind a unique Coder customer identity.');
  }
  return actual.id;
}
