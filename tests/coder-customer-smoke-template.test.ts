import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Railway WonderSpace customer workspace template', () => {
  it('removes the old Kubernetes smoke template', () => {
    expect(existsSync(join(process.cwd(), 'infra/coder/customer-smoke-template/main.tf'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'infra/coder/customer-smoke-template/README.md'))).toBe(false);
  });

  it('creates Railway project, service and persistent volume resources', () => {
    const source = read('infra/coder/template/main.tf');
    expect(source).toContain('resource "terraform_data" "project"');
    expect(source).toContain('resource "terraform_data" "service"');
    expect(source).toContain('resource "terraform_data" "volume"');
    expect(source).toContain('module "code-server"');
    expect(source).not.toContain('provider "kubernetes"');
    expect(source).not.toContain('privileged = true');
  });

  it('uses the AI WONDERLAND baked workspace image', () => {
    const source = read('infra/coder/template/main.tf');
    expect(source).toContain('ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest');
    expect(read('infra/coder/workspace-image/Dockerfile')).toContain('FROM codercom/enterprise-base:ubuntu');
  });
});
