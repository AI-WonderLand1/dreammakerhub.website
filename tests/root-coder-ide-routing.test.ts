import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const template = readFileSync(join(root, 'infra/coder/template/main.tf'), 'utf8');
const repository = readFileSync(join(root, 'infra/coder/template/repository.tf'), 'utf8');
const config = readFileSync(join(root, 'deploy/k8s/configmap.yaml'), 'utf8');
const wildcardIngress = readFileSync(join(root, 'deploy/k8s/workspace-ingress.yaml'), 'utf8');
const provision = readFileSync(join(root, 'apps/web/app/api/user-workspace/provision/route.ts'), 'utf8');

describe('real root Coder IDE routing', () => {
  it('provisions a separate, non-root Kubernetes workspace with persistent home', () => {
    expect(template).toContain('resource "kubernetes_deployment_v1" "main"');
    expect(template).toContain('resource "kubernetes_persistent_volume_claim_v1" "home"');
    expect(template).toContain('run_as_non_root = true');
    expect(template).toContain('name  = "CODER_AGENT_TOKEN"');
  });

  it('proxies the loopback-only editor through a private, isolated Coder app', () => {
    const app = template.match(/resource "coder_app" "code-server" \{([\s\S]*?)\n\}/)?.[1];
    expect(app).toBeDefined();
    expect(app).toMatch(/subdomain\s*=\s*true/);
    expect(app).toMatch(/share\s*=\s*"owner"/);
    expect(app).toContain('http://localhost:13337/');
    expect(template).toContain('--host 127.0.0.1');
    expect(config).toContain('CODER_WILDCARD_ACCESS_URL: "*.coder.dreammakerhub.website"');
    expect(wildcardIngress).toContain('"*.coder.dreammakerhub.website"');
    expect(wildcardIngress).toContain('coder-workspace-tls');
  });

  it('keeps real Coder provisioning and optional public repo parameters wired', () => {
    expect(provision).toContain('new CoderAPIWrapper(');
    expect(provision).toContain("ide: 'code-server'");
    expect(repository).toContain('name         = "repo_url"');
    expect(repository).toContain('name         = "repo_branch"');
  });
});
