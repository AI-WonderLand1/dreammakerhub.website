import 'server-only';

function configuredAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Selects exactly one Supabase account that may control the shared Coder owner.
 * A dedicated ID takes precedence.  The single-admin fallback preserves the
 * previous safe configuration without granting access when several admins exist.
 */
function configuredOperatorId(): string | null {
  const dedicatedOperatorId = process.env.CODER_OPERATOR_SUPABASE_ID?.trim();
  if (dedicatedOperatorId) return dedicatedOperatorId;

  const adminIds = configuredAdminIds();
  return adminIds.length === 1 ? adminIds[0] : null;
}

export function isConfiguredCoderOperator(userId: string | null | undefined): boolean {
  const operatorId = configuredOperatorId();
  return Boolean(userId && operatorId && userId === operatorId);
}
