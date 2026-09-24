import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('customer IDE opening security hold', () => {
  it('authenticates DreamMakerHub users but never returns a Coder dashboard URL', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    expect(route).toContain('authenticatedSupabaseUser(request)');
    expect(route).toContain('CUSTOMER_IDE_GATEWAY_REQUIRED');
    expect(route).toContain('status: 503');
    expect(route).not.toContain('CODER_ACCESS_URL');
    expect(route).not.toContain('coderApiRequest(');
    expect(route).not.toContain('coder.dreammakerhub.website');
    expect(route).not.toContain('export async function POST');
  });

  it('allows the customer pod pilot to render without pretending the browser gateway exists', () => {
    const page = file('apps/web/app/wonderspace/page.tsx');
    expect(page).toContain("process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true'");
    expect(page).not.toContain("process.env.CODER_CUSTOMER_IDE_GATEWAY_VERIFIED === 'true'");
  });

  it('removes direct customer-to-Coder navigation from both customer views', () => {
    const launch = file('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
    const manager = file('apps/web/app/wonderspace/workspaces/page.tsx');
    expect(launch).not.toContain('/api/user-workspace/customer/open/');
    expect(launch).not.toContain('Open my private IDE');
    expect(launch).toContain('you will not be sent to the Coder dashboard');
    expect(manager).not.toContain('/api/user-workspace/customer/open/');
    expect(manager).toContain("openMode !== 'operator'");
    expect(manager).toContain('DreamMakerHub-only gateway');
  });

  it('hardens Coder deployment defaults while direct customer access is paused', () => {
    for (const path of ['deploy/upcloud/docker-compose.yml', 'deploy/k8s/coder-deployment.yaml']) {
      const deployment = file(path);
      expect(deployment).toContain('CODER_DISABLE_WORKSPACE_SHARING');
      expect(deployment).toContain('CODER_DISABLE_OWNER_WORKSPACE_ACCESS');
      expect(deployment).toContain('CODER_DISABLE_PATH_APPS');
      expect(deployment).toContain('CODER_OIDC_ALLOW_SIGNUPS');
    }
  });
});
