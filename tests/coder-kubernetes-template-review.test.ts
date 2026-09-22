import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('AWS Coder template remains separate from web fallback', () => {
  it('retains owner-only code-server and per-workspace Kubernetes storage', () => {
    const template = read('infra/coder/template/main.tf');
    expect(template).toContain('resource "kubernetes_deployment_v1" "main"');
    expect(template).toContain('resource "kubernetes_persistent_volume_claim_v1" "home"');
    expect(template).toContain('share        = "owner"');
    expect(template).toContain('coder-${data.coder_workspace.me.id}-home');
  });

  it('does not conflate the AWS fallback web deploy with customer Kubernetes provisioning', () => {
    const deploy = read('.github/workflows/deploy-aws-fallback.yml');
    const guide = read('docs/operations/CODER_AWS_CUSTOMER_ROLLOUT.md');
    expect(deploy).toContain('deploy/aws-fallback/deploy-web.sh');
    expect(guide).toContain('does **not** install Kubernetes');
    expect(guide).toContain('customer creation remains paused');
  });
});
