import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

// These are source regressions. A real Kubernetes/SSO two-user test is still required.
describe('AWS customer pod preflight', () => {
  const script = file('infra/coder/aws-customer-pod-preflight.sh');
  const workflow = file('.github/workflows/aws-customer-pod-preflight.yml');
  const rbac = file('infra/coder/customer-provisioner-rbac.yaml');
  const isolation = file('infra/coder/customer-isolation.yaml');

  it('discovers context read-only then fails closed on unknown or forbidden operator namespace', () => {
    expect(script).toContain('EXPECTED_KUBE_CONTEXT');
    expect(script).toContain('kubectl config current-context');
    expect(script).toContain('get namespace coder-customers');
    expect(script).toContain('operator_namespace_present=false');
    expect(script).toContain('operator_lookup');
    expect(script).toContain('*NotFound*');
    expect(script).toContain('Cannot verify whether an operator Coder namespace exists');
    expect(script).toContain('auth can-i');
    expect(script).toContain('get secrets coder-customers');
    for (const write of ['kubectl apply', 'kubectl create', 'kubectl delete', 'kubectl patch', 'kubectl replace']) {
      expect(script).not.toContain(write);
    }
  });

  it('uses a manual, Master-only action with verified SSH host identity and no remote file writes', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("if: github.ref == 'refs/heads/Master'");
    expect(workflow).toContain('AWS_CODER_KUBE_CONTEXT');
    expect(workflow).toContain('AWS_FALLBACK_KNOWN_HOSTS');
    expect(workflow).toContain('StrictHostKeyChecking=yes');
    expect(workflow).toContain('bash -s');
    expect(workflow).toContain('< infra/coder/aws-customer-pod-preflight.sh');
    expect(workflow).not.toContain('scp ');
    expect(workflow).not.toContain('kubectl apply');
  });

  it('scopes the provisioner Role to customer deployments/PVCs, not secrets or cluster resources', () => {
    expect(rbac).toContain('kind: Role\n');
    expect(rbac).toContain('kind: RoleBinding\n');
    expect(rbac).toContain('kind: ServiceAccount\n');
    expect(rbac).toContain('namespace: coder-customers');
    expect(rbac).toContain('resources: ["deployments"]');
    expect(rbac).toContain('resources: ["persistentvolumeclaims"]');
    expect(rbac).not.toContain('kind: ClusterRole');
    expect(rbac).not.toContain('kind: ClusterRoleBinding');
    expect(rbac).not.toContain('resources: ["secrets"]');
  });

  it('limits customer resource sizes and enforces restricted pod admission without editing coder namespace', () => {
    expect(isolation).toContain('name: coder-customers');
    expect(isolation).toContain('pod-security.kubernetes.io/enforce: restricted');
    expect(isolation).toContain('kind: ResourceQuota');
    expect(isolation).toContain('kind: LimitRange');
    expect(isolation).toContain('storage: 10Gi');
    expect(isolation).toContain('name: customer-default-deny');
    expect(isolation).not.toContain('namespace: coder\n');
  });
});
