import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const template = readFileSync(join(root, 'infra/coder/template/main.tf'), 'utf8');
const provision = readFileSync(join(root, 'apps/web/app/api/user-workspace/provision/route.ts'), 'utf8');

describe('real root Coder IDE routing on Railway', () => {
  it('provisions one isolated Railway project, service, and persistent volume per workspace', () => {
    expect(template).toContain('resource "terraform_data" "project"');
    expect(template).toContain('resource "terraform_data" "service"');
    expect(template).toContain('resource "terraform_data" "volume"');
    expect(template).toContain('PROJECT_NAME');
    expect(template).toContain('project_create.sh');
    expect(template).toContain('service_create.sh');
    expect(template).toContain('volume_create.sh');
  });

  it('boots the Coder agent inside the Railway workspace image and exposes code-server', () => {
    expect(template).toContain('CODER_AGENT_TOKEN');
    expect(template).toContain('CODER_INIT_SCRIPT_B64');
    expect(template).toContain('module "code-server"');
    expect(template).toContain('ghcr.io/bpmct/railway-coder-workspace:latest');
  });

  it('does not require Kubernetes or accept browser-controlled workspace images', () => {
    expect(template).not.toContain('provider "kubernetes"');
    expect(template).not.toContain('kubernetes_pod');
    expect(template).not.toContain('kubernetes_persistent_volume_claim');
    expect(provision).toContain('This Railway Coder template does not accept repository or image overrides.');
    expect(provision).toContain("richParameterValues.push({ name: 'region', value: region })");
    expect(provision).toContain('new CoderAPIWrapper(');
    expect(provision).toContain("ide: 'code-server'");
  });
});
