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
 * Bind a verified DreamMakerHub account to exactly one active Coder OIDC user.
 * The privileged API token is used only server-side to verify identity and
 * provision that user's workspace. Customers never receive that token.
 */
export async function verifiedCustomerCoderOwner(user: User): Promise<string> {
  if (!user.email || !user.email_confirmed_at || !UUID.test(user.id)) {
    throw new CostGateError('A confirmed DreamMakerHub account is required.', 403);
  }

  const expectedEmail = user.email.trim().toLowerCase();

  const [authMethodsResponse, operatorResponse] = await Promise.all([
    coderApiRequest('/api/v2/users/authmethods', 'GET'),
    coderApiRequest('/api/v2/users/me', 'GET'),
  ]);

  const authMethods = authMethodsResponse.ok ? await authMethodsResponse.json().catch(() => null) : null;
  if (authMethods?.oidc?.enabled !== true) {
    throw new CostGateError('Coder OIDC sign-in is not enabled.');
  }

  const operator = operatorResponse.ok
    ? await operatorResponse.json().catch(() => null) as CoderUser | null
    : null;
  if (!operator?.id || !UUID.test(operator.id)) {
    throw new CostGateError('The Coder service identity could not be verified.');
  }

  const response = await coderApiRequest(
    `/api/v2/users?q=${encodeURIComponent(expectedEmail)}&limit=100`,
    'GET',
  );
  if (!response.ok) throw new CostGateError('Coder customer identity lookup is unavailable.');

  const body = await response.json().catch(() => null) as CoderUsers | null;
  if (!body || !Array.isArray(body.users)) {
    throw new CostGateError('Coder returned an invalid user list.');
  }

  const matches = body.users.filter((candidate) =>
    candidate.email?.trim().toLowerCase() === expectedEmail &&
    candidate.login_type === 'oidc' &&
    candidate.status === 'active' &&
    candidate.is_service_account !== true &&
    UUID.test(candidate.id) &&
    candidate.id !== operator.id
  );

  if (matches.length !== 1) {
    throw new CostGateError('Sign in to Coder once with the same email used by DreamMakerHub, then create your IDE.');
  }

  const coderUser = matches[0];
  const detailResponse = await coderApiRequest(
    `/api/v2/users/${encodeURIComponent(coderUser.id)}`,
    'GET',
  );
  const actual = detailResponse.ok
    ? await detailResponse.json().catch(() => null) as CoderUser | null
    : null;

  if (!actual ||
      actual.id !== coderUser.id ||
      actual.id === operator.id ||
      actual.email?.trim().toLowerCase() !== expectedEmail ||
      actual.login_type !== 'oidc' ||
      actual.status !== 'active' ||
      actual.is_service_account === true) {
    throw new CostGateError('Coder identity could not be independently verified.');
  }

  const db = coderServiceClient();
  const { data: existing, error: lookupError } = await db.from('coder_customer_identities')
    .select('coder_user_id,verified_email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) throw new CostGateError('Customer identity mapping is unavailable.');

  if (existing) {
    if (existing.coder_user_id !== actual.id || existing.verified_email !== expectedEmail) {
      throw new CostGateError('Coder account mapping changed. Contact support; no workspace was created.');
    }
  } else {
    const { error: insertError } = await db.from('coder_customer_identities').insert({
      user_id: user.id,
      coder_user_id: actual.id,
      verified_email: expectedEmail,
    });
    if (insertError) throw new CostGateError('Could not bind a unique Coder customer identity.');
  }

  return actual.id;
}
