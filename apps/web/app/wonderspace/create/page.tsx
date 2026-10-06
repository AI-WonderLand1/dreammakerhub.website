import CustomerWorkspaceLaunch from '@/components/engines/CustomerWorkspaceLaunch';

export const dynamic = 'force-dynamic';

function customerIdeEnabled(): boolean {
  return process.env.CODER_WORKSPACE_CREATION_ENABLED === 'true' &&
    process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true' &&
    Boolean(process.env.CODER_WILDCARD_ACCESS_URL);
}

export default function CustomerWorkspaceCreatePage() {
  return <CustomerWorkspaceLaunch provisioningEnabled={customerIdeEnabled()} />;
}
