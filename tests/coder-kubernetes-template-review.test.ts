import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Coder Railway template review', () => {
  it('uses Railway GraphQL workspace resources instead of Kubernetes resources', () => {
    const template = read('infra/coder/template/main.tf');
    expect(template).toContain('resource "terraform_data" "project"');
    expect(template).toContain('resource "terraform_data" "service"');
    expect(template).toContain('resource "terraform_data" "volume"');
    expect(template).toContain('module "code-server"');
    expect(template).not.toContain('resource "kubernetes_deployment_v1"');
    expect(template).not.toContain('resource "kubernetes_persistent_volume_claim_v1"');
    expect(template).not.toContain('provider "kubernetes"');
  });

  it('keeps the Railway master token sensitive and outside the workspace', () => {
    const template = read('infra/coder/template/main.tf');
    expect(template).toMatch(/variable "railway_token"[\s\S]*?sensitive\s*=\s*true/);
    expect(template).toContain('var.enable_project_management ? 1 : 0');
    expect(template).toContain('project-scoped token');
  });
});
