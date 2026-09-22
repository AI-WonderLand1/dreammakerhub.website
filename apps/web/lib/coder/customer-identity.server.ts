import 'server-only';
import type { User } from '@supabase/supabase-js';
import { CostGateError } from '@/lib/billing/cost-guard.server';
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
export async function verifiedCustomerCoderOwner(user: User): Promise<string> {
  if (process.env.CODER_SUPABASE_OIDC_VERIFIED !== 'true') {
    throw new CostGateError('Customer Coder single sign-on has not been verified.');
  }
  if (!user.email || !user.email_confirmed_at || !UUID.test(user.id)) {
    throw new CostGateError('A confirmed DreamMakerHub account is required.', 402);
  }
  const operators = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim());
  if (operators.includes(user.id)) {
    throw new CostGateError('The operator account cannot be enrolled as a customer.');
  }
  const expectedEmail = user.email.trim().toLowerCase();
  const authMethods = await coderApiRequest('/api/v2/users/authmethods', 'GET');
  if (!authMethods.ok || (await authMethods.json().catch(() => null))?.oidc?.enabled !== true) {
    throw new CostGateError('Coder customer OIDC login is not enabled.');
  }
  const response = await coderApiRequest(`/api/v2/users?q=${encodeURIComponent(expectedEmail)}&limit=100`, 'GET');
  if (!response.ok) throw new CostGateError('Coder customer identity lookup is unavailable.');
  const body = await response.json().catch(() => null) as CoderUsers | null;
  if (!body || !Array.isArray(body.users)) throw new CostGateError('Coder returned an invalid user list.');
  const matches = body.users.filter((candidate) =>
    candidate.email?.trim().toLowerCase() === expectedEmail &&
    candidate.login_type === 'oidc' && candidate.status === 'active' &&
    candidate.is_service_account !== true && UUID.test(candidate.id));
  if (matches.length !== 1) {
    throw new CostGateError('Sign in to Coder with the same verified account before requesting an IDE.');
  }
  const coderUser = matches[0];
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
