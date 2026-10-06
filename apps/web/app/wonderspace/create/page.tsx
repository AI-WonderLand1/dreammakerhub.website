import CustomerWorkspaceLaunch from '@/components/engines/CustomerWorkspaceLaunch';

export const dynamic = 'force-dynamic';

function customerIdeEnabled(): boolean {
  return process.env.BILLABLE_OPERATIONS_ENABLED === 'true' &&
    process.env.CODER_WORKSPACE_CREATION_ENABLED === 'true' &&
    process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true' &&
    process.env.CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED === 'true' &&
    process.env.CODER_CUSTOMER_HARD_STOP_VERIFIED === 'true' &&
    process.env.CODER_SUPABASE_OIDC_VERIFIED === 'true' &&
    process.env.CODER_CUSTOMER_DIRECT_ACCESS_VERIFIED === 'true' &&
    Boolean(process.env.CODER_WILDCARD_ACCESS_URL);
}

export default function CustomerWorkspaceCreatePage() {
  return <CustomerWorkspaceLaunch provisioningEnabled={customerIdeEnabled()} />;
}
