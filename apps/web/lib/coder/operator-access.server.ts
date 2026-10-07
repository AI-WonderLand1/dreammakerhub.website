import 'server-only';

function configuredAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Selects exactly one Supabase account that may control the shared Coder owner.
 * ADMIN_USER_ID is the canonical single-admin setting for this deployment.
 * CODER_OPERATOR_SUPABASE_ID remains a compatibility fallback, followed by the
 * older comma-separated ADMIN_USER_IDS setting when it contains exactly one ID.
 */
function configuredOperatorId(): string | null {
  const canonicalAdminId = process.env.ADMIN_USER_ID?.trim();
  if (canonicalAdminId) return canonicalAdminId;

  const dedicatedOperatorId = process.env.CODER_OPERATOR_SUPABASE_ID?.trim();
  if (dedicatedOperatorId) return dedicatedOperatorId;

  const adminIds = configuredAdminIds();
  return adminIds.length === 1 ? adminIds[0] : null;
}

export function isConfiguredCoderOperator(userId: string | null | undefined): boolean {
  const operatorId = configuredOperatorId();
  return Boolean(userId && operatorId && userId === operatorId);
}
